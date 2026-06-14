// functions/api/[[route]].js
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyPassword, generateSecureToken } from '../helpers/auth';

const app = new Hono().basePath('/api');

// --- Helper: Validate session and return user object ---
async function getAuthenticatedUser(c) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;

  try {
    const session = await c.env.DB.prepare(
      "SELECT s.username, s.role, u.fullName FROM sessions s JOIN users u ON s.username = u.username WHERE s.id = ? AND s.expiresAt > datetime('now') LIMIT 1"
    ).bind(sessionId).first();

    if (!session) return null;
    return {
      username: session.username,
      role: session.role,
      fullName: session.fullName
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
      "SELECT username, password, role, fullName FROM users WHERE username = ? LIMIT 1"
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
        fullName: user.fullName
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

// 4. GET /api/settings - Fetch public/private settings
app.get('/settings', async (c) => {
  try {
    const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'private_mode' LIMIT 1").first();
    const isPrivateMode = row ? (row.value === 'true') : true;
    return c.json({ success: true, privateMode: isPrivateMode });
  } catch (err) {
    return c.json({ success: false, privateMode: true, error: err.message });
  }
});

// 5. POST /api/settings - Update settings (Admin only)
app.post('/settings', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.role !== 'admin') {
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

// 6. GET /api/members - Fetch family tree members
app.get('/members', async (c) => {
  try {
    // Check privacy mode
    const privacyRow = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'private_mode' LIMIT 1").first();
    const isPrivateMode = privacyRow ? (privacyRow.value === 'true') : true;

    if (isPrivateMode) {
      const user = await getAuthenticatedUser(c);
      if (!user || user.role === 'guest') {
        return c.json({ success: false, error: 'Chế độ riêng tư đang bật. Vui lòng đăng nhập tài khoản thành viên.' }, 403);
      }
    }

    const { results } = await c.env.DB.prepare("SELECT * FROM members").all();

    // Map database structures back to React-friendly format
    const formatted = results.map(row => ({
      ...row,
      isDeceased: row.isDeceased === 1,
      isFeatured: row.isFeatured === 1,
      spouseIds: JSON.parse(row.spouseIds || '[]'),
      fatherId: row.fatherId || null,
      motherId: row.motherId || null
    }));

    return c.json({ success: true, data: formatted });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 7. POST /api/members - Create a new family member (Admin/Editor only)
app.post('/members', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const data = await c.req.json();
    const id = data.id || `member_${Date.now()}`;

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

// 8. PUT /api/members/:id - Update family member details (Admin/Editor only)
app.put('/members/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  const memberId = c.req.param('id');

  try {
    const data = await c.req.json();

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

// 9. DELETE /api/members/:id - Remove a member (Admin only)
app.delete('/members/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.role !== 'admin') {
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
