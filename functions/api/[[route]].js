// functions/api/[[route]].js
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyPassword, generateSecureToken, hashPassword } from '../helpers/auth';

const app = new Hono().basePath('/api');
const ADMIN_ROLE = 'admin';
const EDITOR_ROLE = 'editor';
const VIEWER_ROLE = 'member';
const LEGACY_VIEWER_ROLE = 'viewer';
const ALLOWED_USER_ROLES = new Set([ADMIN_ROLE, EDITOR_ROLE, VIEWER_ROLE, LEGACY_VIEWER_ROLE]);
const SENSITIVE_PHONE_MASK = 'Đã ẩn số điện thoại';
const SENSITIVE_LOCATION_MASK = 'Đã ẩn địa chỉ';

function isAuthenticatedViewer(user) {
  return Boolean(user && user.role !== 'guest');
}

function canEditMembers(user) {
  return Boolean(user && (user.role === ADMIN_ROLE || user.role === EDITOR_ROLE));
}

function isAdmin(user) {
  return Boolean(user && user.role === ADMIN_ROLE);
}

function normalizeUserRole(role) {
  const normalized = String(role || VIEWER_ROLE).trim().toLowerCase();
  return ALLOWED_USER_ROLES.has(normalized) ? normalized : VIEWER_ROLE;
}

function hasValue(value) {
  return String(value || '').trim().length > 0;
}

function maskSensitiveMember(member) {
  const sensitiveMasked = hasValue(member.phone)
    || hasValue(member.address)
    || hasValue(member.birthPlace)
    || hasValue(member.restingPlace);

  if (!sensitiveMasked) {
    return { ...member, sensitiveMasked: false };
  }

  return {
    ...member,
    phone: hasValue(member.phone) ? SENSITIVE_PHONE_MASK : '',
    address: hasValue(member.address) ? SENSITIVE_LOCATION_MASK : '',
    birthPlace: hasValue(member.birthPlace) ? SENSITIVE_LOCATION_MASK : '',
    restingPlace: hasValue(member.restingPlace) ? SENSITIVE_LOCATION_MASK : '',
    sensitiveMasked: true
  };
}

async function getPrivateMode(db) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'private_mode' LIMIT 1").first();
  return row ? (row.value === 'true') : true;
}

function validateUsername(username) {
  const value = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(value)) return null;
  return value;
}

function parseSpouseIds(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

function formatMemberRow(row) {
  return {
    ...row,
    isDeceased: row.isDeceased === 1,
    isFeatured: row.isFeatured === 1,
    spouseIds: parseSpouseIds(row.spouseIds),
    fatherId: row.fatherId || null,
    motherId: row.motherId || null
  };
}

async function fetchFormattedMembers(db) {
  const { results } = await db.prepare("SELECT * FROM members").all();
  return results.map(formatMemberRow);
}

function buildEditorScopeIds(members, rootId) {
  if (!rootId) return null;
  const memberById = new Map(members.map(member => [member.id, member]));
  if (!memberById.has(rootId)) return new Set();

  const scopeIds = new Set([rootId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const member of members) {
      const isChildOfScope = scopeIds.has(member.fatherId) || scopeIds.has(member.motherId);
      const isSpouseOfScope = member.spouseIds?.some(spouseId => scopeIds.has(spouseId));
      const hasSpouseInScope = Array.from(scopeIds).some(scopeId => {
        const scopedMember = memberById.get(scopeId);
        return scopedMember?.spouseIds?.includes(member.id);
      });

      if ((isChildOfScope || isSpouseOfScope || hasSpouseInScope) && !scopeIds.has(member.id)) {
        scopeIds.add(member.id);
        changed = true;
      }
    }
  }

  return scopeIds;
}

function getUserScopeIds(user, members) {
  if (!user || user.role !== EDITOR_ROLE || !user.editScopeRootId) return null;
  return buildEditorScopeIds(members, user.editScopeRootId);
}

function canEditMember(user, members, memberId) {
  if (isAdmin(user)) return true;
  if (user?.role !== EDITOR_ROLE) return false;
  if (!user.editScopeRootId) return true;
  return getUserScopeIds(user, members)?.has(memberId) || false;
}

function canCreateMember(user, members, data) {
  if (isAdmin(user)) return true;
  if (user?.role !== EDITOR_ROLE) return false;
  if (!user.editScopeRootId) return true;

  const scopeIds = getUserScopeIds(user, members);
  if (!scopeIds || scopeIds.size === 0) return false;

  const relatedIds = [
    data.fatherId,
    data.motherId,
    ...(Array.isArray(data.spouseIds) ? data.spouseIds : [])
  ].filter(Boolean);

  return relatedIds.some(id => scopeIds.has(id));
}

function relationsStayInScope(user, members, data, oldMember = null) {
  if (isAdmin(user)) return true;
  if (user?.role !== EDITOR_ROLE) return false;
  if (!user.editScopeRootId) return true;

  const scopeIds = getUserScopeIds(user, members);
  const oldSpouseIds = parseSpouseIds(oldMember?.spouseIds);
  const relationChecks = [
    { id: data.fatherId, allowedOldIds: [oldMember?.fatherId] },
    { id: data.motherId, allowedOldIds: [oldMember?.motherId] },
    ...(Array.isArray(data.spouseIds) ? data.spouseIds : []).map(id => ({ id, allowedOldIds: oldSpouseIds }))
  ].filter(item => item.id);

  return relationChecks.every(({ id, allowedOldIds }) => scopeIds?.has(id) || allowedOldIds.includes(id));
}

// --- Helper: Validate session and return user object ---
async function getAuthenticatedUser(c) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;

  try {
    const session = await c.env.DB.prepare(
      "SELECT s.username, s.role, u.fullName, u.editScopeRootId FROM sessions s JOIN users u ON s.username = u.username WHERE s.id = ? AND s.expiresAt > datetime('now') LIMIT 1"
    ).bind(sessionId).first();

    if (!session) return null;
    return {
      username: session.username,
      role: session.role,
      fullName: session.fullName,
      editScopeRootId: session.editScopeRootId || null
    };
  } catch (err) {
    console.error('Session validation error:', err);
    return null;
  }
}

// --- Helper: Sync bidirectional spouse relationships ---
async function syncSpouseRelationships(db, memberId, newSpouseIds, oldSpouseIds = []) {
  const added = newSpouseIds.filter(id => !oldSpouseIds.includes(id));
  const removed = oldSpouseIds.filter(id => !newSpouseIds.includes(id));

  // Add memberId to new spouses' list
  for (const spId of added) {
    const row = await db.prepare("SELECT spouseIds FROM members WHERE id = ?").bind(spId).first();
    if (row) {
      const list = JSON.parse(row.spouseIds || '[]');
      if (!list.includes(memberId)) {
        list.push(memberId);
        await db.prepare("UPDATE members SET spouseIds = ? WHERE id = ?").bind(JSON.stringify(list), spId).run();
      }
    }
  }

  // Remove memberId from old removed spouses' list
  for (const spId of removed) {
    const row = await db.prepare("SELECT spouseIds FROM members WHERE id = ?").bind(spId).first();
    if (row) {
      const list = JSON.parse(row.spouseIds || '[]');
      const filtered = list.filter(id => id !== memberId);
      await db.prepare("UPDATE members SET spouseIds = ? WHERE id = ?").bind(JSON.stringify(filtered), spId).run();
    }
  }
}

// --- API Router Endpoints ---

// 1. GET /api/auth/me - Check current authentication status
app.get('/auth/me', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) {
    return c.json({ success: false, user: null });
  }
  return c.json({ success: true, user });
});

// 2. POST /api/auth/login - Authenticate credentials and establish session
app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, error: 'Vui lòng cung cấp đầy đủ tên tài khoản và mật khẩu.' }, 400);
    }

    const user = await c.env.DB.prepare(
      "SELECT username, password, role, fullName, editScopeRootId FROM users WHERE username = ? LIMIT 1"
    ).bind(username.trim().toLowerCase()).first();

    if (!user) {
      return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    // Create session
    const sessionId = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    await c.env.DB.prepare(
      "INSERT INTO sessions (id, username, role, expiresAt) VALUES (?, ?, ?, ?)"
    ).bind(sessionId, user.username, user.role, expiresAt).run();

    // Set cookie (Secure HTTP-Only)
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours in seconds
    });

    return c.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        editScopeRootId: user.editScopeRootId || null
      }
    });
  } catch (err) {
    return c.json({ success: false, error: 'Đã xảy ra lỗi hệ thống: ' + err.message }, 500);
  }
});

// 3. POST /api/auth/logout - Terminate session
app.post('/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');
  if (sessionId) {
    try {
      await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    } catch (err) {
      console.error('Session delete error:', err);
    }
  }

  deleteCookie(c, 'session_id', { path: '/' });
  return c.json({ success: true, message: 'Đăng xuất thành công.' });
});

// 4. POST /api/auth/change-password - Change current account password
app.post('/auth/change-password', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) {
    return c.json({ success: false, error: 'Bạn cần đăng nhập để đổi mật khẩu.' }, 401);
  }

  try {
    const { currentPassword, newPassword } = await c.req.json();
    const current = String(currentPassword || '');
    const next = String(newPassword || '');

    if (!current || !next) {
      return c.json({ success: false, error: 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.' }, 400);
    }
    if (next.length < 8) {
      return c.json({ success: false, error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' }, 400);
    }
    if (current === next) {
      return c.json({ success: false, error: 'Mật khẩu mới không nên trùng mật khẩu hiện tại.' }, 400);
    }

    const account = await c.env.DB.prepare(
      "SELECT username, password FROM users WHERE username = ? LIMIT 1"
    ).bind(user.username).first();

    if (!account) {
      return c.json({ success: false, error: 'Không tìm thấy tài khoản hiện tại.' }, 404);
    }

    const isValid = await verifyPassword(current, account.password);
    if (!isValid) {
      return c.json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' }, 401);
    }

    const hashed = await hashPassword(next);
    await c.env.DB.prepare(
      "UPDATE users SET password = ? WHERE username = ?"
    ).bind(hashed, user.username).run();

    const sessionId = getCookie(c, 'session_id');
    if (sessionId) {
      await c.env.DB.prepare(
        "DELETE FROM sessions WHERE username = ? AND id != ?"
      ).bind(user.username, sessionId).run();
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. GET /api/settings - Fetch public/private settings
app.get('/settings', async (c) => {
  try {
    const isPrivateMode = await getPrivateMode(c.env.DB);
    return c.json({ success: true, privateMode: isPrivateMode });
  } catch (err) {
    return c.json({ success: false, privateMode: true, error: err.message });
  }
});

// 5. POST /api/settings - Update settings (Admin only)
app.post('/settings', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const { privateMode } = await c.req.json();
    const valueStr = privateMode ? 'true' : 'false';

    await c.env.DB.prepare(
      "INSERT INTO settings (key, value, updatedAt) VALUES ('private_mode', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt"
    ).bind(valueStr).run();

    return c.json({ success: true, privateMode });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. GET /api/users - Manage application accounts (Admin only)
app.get('/users', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT username, role, fullName, editScopeRootId, createdAt FROM users ORDER BY createdAt ASC, username ASC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 7. POST /api/users - Create application account (Admin only)
app.post('/users', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const data = await c.req.json();
    const username = validateUsername(data.username);
    const password = String(data.password || '');
    const role = normalizeUserRole(data.role);
    const fullName = String(data.fullName || '').trim();
    const editScopeRootId = role === EDITOR_ROLE ? (String(data.editScopeRootId || '').trim() || null) : null;

    if (!username) {
      return c.json({ success: false, error: 'Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch dưới/gạch ngang và dài 3-32 ký tự.' }, 400);
    }
    if (password.length < 8) {
      return c.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' }, 400);
    }

    const existing = await c.env.DB.prepare("SELECT username FROM users WHERE username = ? LIMIT 1").bind(username).first();
    if (existing) {
      return c.json({ success: false, error: 'Tên đăng nhập đã tồn tại.' }, 409);
    }
    if (editScopeRootId) {
      const scopeRoot = await c.env.DB.prepare("SELECT id FROM members WHERE id = ? LIMIT 1").bind(editScopeRootId).first();
      if (!scopeRoot) {
        return c.json({ success: false, error: 'Không tìm thấy chi/phạm vi chỉnh sửa đã chọn.' }, 400);
      }
    }

    const hashed = await hashPassword(password);
    await c.env.DB.prepare(
      "INSERT INTO users (username, password, role, fullName, editScopeRootId) VALUES (?, ?, ?, ?, ?)"
    ).bind(username, hashed, role, fullName, editScopeRootId).run();

    return c.json({ success: true, user: { username, role, fullName, editScopeRootId } });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 8. PUT /api/users/:username - Update application account (Admin only)
app.put('/users/:username', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const username = validateUsername(c.req.param('username'));
    if (!username) {
      return c.json({ success: false, error: 'Tên đăng nhập không hợp lệ.' }, 400);
    }

    const existing = await c.env.DB.prepare("SELECT username, role FROM users WHERE username = ? LIMIT 1").bind(username).first();
    if (!existing) {
      return c.json({ success: false, error: 'Không tìm thấy tài khoản.' }, 404);
    }

    const data = await c.req.json();
    const role = normalizeUserRole(data.role);
    const fullName = String(data.fullName || '').trim();
    const password = String(data.password || '');
    const editScopeRootId = role === EDITOR_ROLE ? (String(data.editScopeRootId || '').trim() || null) : null;
    if (editScopeRootId) {
      const scopeRoot = await c.env.DB.prepare("SELECT id FROM members WHERE id = ? LIMIT 1").bind(editScopeRootId).first();
      if (!scopeRoot) {
        return c.json({ success: false, error: 'Không tìm thấy chi/phạm vi chỉnh sửa đã chọn.' }, 400);
      }
    }

    if (existing.role === ADMIN_ROLE && role !== ADMIN_ROLE) {
      const adminCount = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first();
      if (Number(adminCount?.count || 0) <= 1) {
        return c.json({ success: false, error: 'Không thể hạ quyền tài khoản admin cuối cùng.' }, 400);
      }
    }

    if (password) {
      if (password.length < 8) {
        return c.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' }, 400);
      }
      const hashed = await hashPassword(password);
      await c.env.DB.prepare(
        "UPDATE users SET role = ?, fullName = ?, editScopeRootId = ?, password = ? WHERE username = ?"
      ).bind(role, fullName, editScopeRootId, hashed, username).run();
    } else {
      await c.env.DB.prepare(
        "UPDATE users SET role = ?, fullName = ?, editScopeRootId = ? WHERE username = ?"
      ).bind(role, fullName, editScopeRootId, username).run();
    }

    return c.json({ success: true, user: { username, role, fullName, editScopeRootId } });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 9. DELETE /api/users/:username - Delete application account (Admin only)
app.delete('/users/:username', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const username = validateUsername(c.req.param('username'));
    if (!username) {
      return c.json({ success: false, error: 'Tên đăng nhập không hợp lệ.' }, 400);
    }
    if (username === user.username) {
      return c.json({ success: false, error: 'Không thể xóa tài khoản đang đăng nhập.' }, 400);
    }

    const existing = await c.env.DB.prepare("SELECT username, role FROM users WHERE username = ? LIMIT 1").bind(username).first();
    if (!existing) {
      return c.json({ success: false, error: 'Không tìm thấy tài khoản.' }, 404);
    }

    if (existing.role === ADMIN_ROLE) {
      const adminCount = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first();
      if (Number(adminCount?.count || 0) <= 1) {
        return c.json({ success: false, error: 'Không thể xóa tài khoản admin cuối cùng.' }, 400);
      }
    }

    await c.env.DB.prepare("DELETE FROM sessions WHERE username = ?").bind(username).run();
    await c.env.DB.prepare("DELETE FROM users WHERE username = ?").bind(username).run();
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 10. GET /api/members - Fetch family tree members
app.get('/members', async (c) => {
  try {
    // Check privacy mode
    const isPrivateMode = await getPrivateMode(c.env.DB);
    const user = await getAuthenticatedUser(c);

    if (isPrivateMode) {
      if (!isAuthenticatedViewer(user)) {
        return c.json({ success: false, error: 'Chế độ riêng tư đang bật. Vui lòng đăng nhập tài khoản thành viên.' }, 403);
      }
    }

    const formatted = await fetchFormattedMembers(c.env.DB);
    const wantsSensitiveReveal = c.req.query('revealSensitive') === 'true';
    const canRevealSensitiveInfo = isPrivateMode && isAuthenticatedViewer(user);
    const revealSensitiveInfo = wantsSensitiveReveal && canRevealSensitiveInfo;
    const editableScopeIds = user?.role === EDITOR_ROLE && user.editScopeRootId
      ? Array.from(getUserScopeIds(user, formatted) || [])
      : null;

    return c.json({
      success: true,
      data: revealSensitiveInfo ? formatted.map(member => ({ ...member, sensitiveMasked: false })) : formatted.map(maskSensitiveMember),
      sensitiveInfoVisible: revealSensitiveInfo,
      canRevealSensitiveInfo,
      editableScopeIds
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 11. POST /api/members - Create a new family member (Admin/Editor only)
app.post('/members', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!canEditMembers(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const data = await c.req.json();
    const id = data.id || `member_${Date.now()}`;
    const members = await fetchFormattedMembers(c.env.DB);

    if (!canCreateMember(user, members, data)) {
      return c.json({ success: false, error: 'Tài khoản biên tập viên này chỉ được thêm thành viên trong chi được phân quyền.' }, 403);
    }

    await c.env.DB.prepare(`
      INSERT INTO members (
        id, name, gender, generation, isDeceased, birthDate, deathDate,
        birthPlace, restingPlace, occupation, bio, phone, address,
        avatar, isFeatured, spouseIds, fatherId, motherId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.name,
      data.gender,
      data.generation,
      data.isDeceased ? 1 : 0,
      data.birthDate || null,
      data.deathDate || null,
      data.birthPlace || '',
      data.restingPlace || '',
      data.occupation || '',
      data.bio || '',
      data.phone || '',
      data.address || '',
      data.avatar || null,
      data.isFeatured ? 1 : 0,
      JSON.stringify(data.spouseIds || []),
      data.fatherId || null,
      data.motherId || null
    ).run();

    // Sync spouse relationships bidirectionally
    await syncSpouseRelationships(c.env.DB, id, data.spouseIds || []);

    return c.json({ success: true, id });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 12. PUT /api/members/:id - Update family member details (Admin/Editor only)
app.put('/members/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!canEditMembers(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  const memberId = c.req.param('id');

  try {
    const data = await c.req.json();
    const members = await fetchFormattedMembers(c.env.DB);
    const oldMember = members.find(member => member.id === memberId);

    if (!canEditMember(user, members, memberId)) {
      return c.json({ success: false, error: 'Tài khoản biên tập viên này chỉ được sửa thành viên trong chi được phân quyền.' }, 403);
    }
    if (!relationsStayInScope(user, members, data, oldMember)) {
      return c.json({ success: false, error: 'Không thể gắn cha/mẹ/vợ/chồng ngoài chi được phân quyền.' }, 403);
    }

    // Fetch old spouseIds first for delta sync
    const oldRow = await c.env.DB.prepare("SELECT spouseIds FROM members WHERE id = ?").bind(memberId).first();
    const oldSpouseIds = oldRow ? JSON.parse(oldRow.spouseIds || '[]') : [];

    await c.env.DB.prepare(`
      UPDATE members SET
        name = ?, gender = ?, generation = ?, isDeceased = ?, birthDate = ?, deathDate = ?,
        birthPlace = ?, restingPlace = ?, occupation = ?, bio = ?, phone = ?, address = ?,
        avatar = ?, isFeatured = ?, spouseIds = ?, fatherId = ?, motherId = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      data.name,
      data.gender,
      data.generation,
      data.isDeceased ? 1 : 0,
      data.birthDate || null,
      data.deathDate || null,
      data.birthPlace || '',
      data.restingPlace || '',
      data.occupation || '',
      data.bio || '',
      data.phone || '',
      data.address || '',
      data.avatar || null,
      data.isFeatured ? 1 : 0,
      JSON.stringify(data.spouseIds || []),
      data.fatherId || null,
      data.motherId || null,
      memberId
    ).run();

    // Sync spouse relationships bidirectionally
    await syncSpouseRelationships(c.env.DB, memberId, data.spouseIds || [], oldSpouseIds);

    return c.json({ success: true, id: memberId });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 13. DELETE /api/members/:id - Remove a member (Admin only)
app.delete('/members/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  const memberId = c.req.param('id');

  try {
    // 1. Delete from D1
    await c.env.DB.prepare("DELETE FROM members WHERE id = ?").bind(memberId).run();

    // 2. Clean up references in other members (spouseIds, fatherId, motherId).
    // Clean spouse references
    await c.env.DB.prepare(`
      UPDATE members 
      SET spouseIds = (
        SELECT json_group_array(value) 
        FROM json_each(spouseIds) 
        WHERE value != ?
      )
      WHERE spouseIds LIKE ?
    `).bind(memberId, `%${memberId}%`).run();

    // Reset parents references
    await c.env.DB.prepare("UPDATE members SET fatherId = NULL WHERE fatherId = ?").bind(memberId).run();
    await c.env.DB.prepare("UPDATE members SET motherId = NULL WHERE motherId = ?").bind(memberId).run();

    return c.json({ success: true, message: 'Đã xóa thành viên thành công.' });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export const onRequest = handle(app);
