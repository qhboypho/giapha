// functions/api/[[route]].js
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyPassword, generateSecureToken, hashPassword, passwordNeedsRehash } from '../helpers/auth';
import {
  AI_CONFIG_SETTING_KEY,
  buildKeyPreview,
  buildPublicAiConfig,
  getAiProviderConfig,
  parseAiConfigValue,
  serializeAiConfig,
  validateAiConfigInput
} from '../../src/utils/aiConfigUtils.js';
import {
  buildCmsPackage,
  buildCmsPackagePreview,
  normalizeImportedCmsPackage,
  validateCmsPackageRelations
} from '../../src/utils/cmsPackageUtils.js';
import {
  buildMemberSyncAiPrompt,
  buildMemberSyncExport,
  buildMemberSyncPreview,
  buildMemberSyncSample,
  normalizeImportedMembers,
  normalizeMemberForSync,
  validateMemberRelations
} from '../../src/utils/memberSyncUtils.js';
import {
  buildMediaPackage,
  buildMediaPackagePreview,
  normalizeImportedMediaPackage
} from '../../src/utils/mediaPackageUtils.js';
import {
  SITE_CONFIG_SETTING_KEY,
  parseSiteConfigValue,
  serializeSiteConfig,
  validateSiteConfigInput
} from '../../src/utils/siteConfigUtils.js';

const app = new Hono().basePath('/api');
const ADMIN_ROLE = 'admin';
const EDITOR_ROLE = 'editor';
const VIEWER_ROLE = 'member';
const LEGACY_VIEWER_ROLE = 'viewer';
const ROOT_ADMIN_USERNAME = 'admin';
const ALLOWED_USER_ROLES = new Set([ADMIN_ROLE, EDITOR_ROLE, VIEWER_ROLE, LEGACY_VIEWER_ROLE]);
const SENSITIVE_PHONE_MASK = 'Đã ẩn số điện thoại';
const SENSITIVE_LOCATION_MASK = 'Đã ẩn địa chỉ';
const HISTORY_IMAGE_LIMIT = 8;
const HISTORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_HISTORY_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SITE_ASSET_MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_SITE_ASSET_TYPES = ALLOWED_HISTORY_IMAGE_TYPES;
const ACTIVE_VIEWER_WINDOW_SECONDS = 90;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;
const LOGIN_FAILURE_DELAY_MS = 220;
const VIEWER_PRESENCE_MAX_ACTIVE_PER_IP = 20;
const MAX_AVATAR_DATA_URI_LENGTH = 200 * 1024;
const ALLOWED_AVATAR_DATA_URI_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const AI_IMPORT_MAX_FILES = 8;
const AI_IMPORT_MAX_FILE_BYTES = 8 * 1024 * 1024;
const AI_IMPORT_MAX_TOTAL_BYTES = 24 * 1024 * 1024;
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_FILES_URL = 'https://api.openai.com/v1/files';
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const CLAUDE_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODELS_URL = 'https://api.anthropic.com/v1/models';
const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CLAUDE_API_VERSION = '2023-06-01';
const ALLOWED_AI_SOURCE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

class PublicValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PublicValidationError';
    this.status = status;
    this.publicMessage = message;
  }
}

app.use('*', async (c, next) => {
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; manifest-src 'self' data:; worker-src 'self'"
  );
  await next();
});

function isAuthenticatedViewer(user) {
  return Boolean(user && user.role !== 'guest');
}

function canEditMembers(user) {
  return Boolean(user && (user.role === ADMIN_ROLE || user.role === EDITOR_ROLE));
}

function isAdmin(user) {
  return Boolean(user && user.role === ADMIN_ROLE);
}

function isRootAdminUser(user) {
  return Boolean(user && user.username === ROOT_ADMIN_USERNAME && user.role === ADMIN_ROLE);
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

async function getSiteConfig(db) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ? LIMIT 1").bind(SITE_CONFIG_SETTING_KEY).first();
  return parseSiteConfigValue(row?.value);
}

async function getStoredAiConfig(db) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ? LIMIT 1").bind(AI_CONFIG_SETTING_KEY).first();
  return parseAiConfigValue(row?.value);
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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
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

function formatHistoryEventRow(row) {
  return {
    ...row,
    isHomepageVisible: row.isHomepageVisible === 1,
    relatedMemberIds: parseJsonArray(row.relatedMemberIds),
    images: parseJsonArray(row.imageUrls).map(normalizeHistoryImage).filter(Boolean),
    sortOrder: Number(row.sortOrder || 0)
  };
}

async function fetchFormattedMembers(db) {
  const { results } = await db.prepare("SELECT * FROM members").all();
  return results.map(formatMemberRow);
}

function buildMemberSyncFilename(prefix = 'giapha-members') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

function buildCmsPackageFilename(prefix = 'giapha-cms-package') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

function buildMediaPackageFilename(prefix = 'giapha-media-package') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

function jsonDownloadResponse(payload, filename) {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

function textDownloadResponse(content, filename) {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

async function fetchHistoryEvents(db, includeHidden = false) {
  const query = includeHidden
    ? "SELECT * FROM family_history_events ORDER BY eventDate ASC, sortOrder ASC, createdAt ASC"
    : "SELECT * FROM family_history_events WHERE isHomepageVisible = 1 ORDER BY eventDate ASC, sortOrder ASC, createdAt ASC";
  const { results } = await db.prepare(query).all();
  return results.map(formatHistoryEventRow);
}

function normalizeHistoryEventPayload(data = {}) {
  const eventDate = String(data.eventDate || '').trim();
  const title = String(data.title || '').trim();
  const description = String(data.description || '').trim();
  const relatedBranch = String(data.relatedBranch || '').trim();
  const relatedMemberIds = Array.isArray(data.relatedMemberIds)
    ? data.relatedMemberIds.map((id) => String(id || '').trim()).filter(Boolean)
    : [];
  const sortOrder = Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;
  const images = Array.isArray(data.images)
    ? data.images
      .slice(0, HISTORY_IMAGE_LIMIT)
      .map(normalizeHistoryImage)
      .filter(Boolean)
    : [];

  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(eventDate)) {
    return { error: 'Thời gian cột mốc cần nhập dạng YYYY, YYYY-MM hoặc YYYY-MM-DD.' };
  }
  if (!title) {
    return { error: 'Vui lòng nhập tiêu đề cột mốc lịch sử.' };
  }

  return {
    eventDate,
    title,
    description,
    relatedBranch,
    relatedMemberIds,
    images,
    isHomepageVisible: Boolean(data.isHomepageVisible),
    sortOrder
  };
}

function sanitizeFileName(name = '') {
  return String(name || 'history-image')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'history-image';
}

function safeDecodePath(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeViewerId(value = '') {
  const id = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{16,80}$/.test(id) ? id : null;
}

function normalizeIncenseKey(value = '') {
  const key = String(value || '').trim();
  return /^[a-zA-Z0-9:_-]{2,80}$/.test(key) ? key : null;
}

function normalizeIncenseGiftItems(value = []) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => String(item || '').trim())
      .filter((item) => /^[a-zA-Z0-9_-]{2,40}$/.test(item))
  )).slice(0, 12);
}

function getClientIp(c) {
  return String(
    c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')?.split(',')[0]
      || c.req.header('x-real-ip')
      || 'unknown'
  ).trim().slice(0, 80) || 'unknown';
}

function getSessionCookieOptions(c) {
  const url = new URL(c.req.url);
  return {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: 24 * 60 * 60
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serverError(c, label, err, extra = {}) {
  if (err?.publicMessage) {
    return c.json({ success: false, ...extra, error: err.publicMessage }, err.status || 400);
  }
  console.error(`[${label}]`, err);
  return c.json({ success: false, ...extra, error: 'Đã xảy ra lỗi hệ thống.' }, 500);
}

function inputError(c, label, err, message = 'Dữ liệu gửi lên chưa hợp lệ.') {
  if (err?.publicMessage) {
    return c.json({ success: false, error: err.publicMessage }, err.status || 400);
  }
  console.warn(`[${label}]`, err?.message || err);
  return c.json({ success: false, error: message }, 400);
}

async function isLoginRateLimited(db, ipAddress, username) {
  await db.prepare("DELETE FROM login_attempts WHERE attemptedAt < datetime('now', ?)").bind(`-${LOGIN_RATE_LIMIT_WINDOW_SECONDS} seconds`).run();
  const row = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM login_attempts
    WHERE attemptedAt >= datetime('now', ?)
      AND (ipAddress = ? OR username = ?)
  `).bind(`-${LOGIN_RATE_LIMIT_WINDOW_SECONDS} seconds`, ipAddress, username).first();
  return Number(row?.count || 0) >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

async function recordFailedLogin(db, ipAddress, username) {
  await db.prepare(
    "INSERT INTO login_attempts (id, ipAddress, username, attemptedAt) VALUES (?, ?, ?, datetime('now'))"
  ).bind(generateSecureToken(12), ipAddress, username).run();
}

async function clearLoginAttempts(db, ipAddress, username) {
  await db.prepare("DELETE FROM login_attempts WHERE ipAddress = ? OR username = ?").bind(ipAddress, username).run();
}

async function verifyTurnstileIfEnabled(c, siteConfig, token, ipAddress) {
  const security = parseSiteConfigValue(siteConfig).security;
  if (!security.turnstileEnabled) {
    return { ok: true };
  }

  if (!security.turnstileSiteKey) {
    return { ok: false, status: 503, error: 'Turnstile chưa được cấu hình Site Key.' };
  }

  const secret = String(c.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) {
    return { ok: false, status: 503, error: 'Turnstile chưa được cấu hình Secret Key trên máy chủ.' };
  }

  const responseToken = String(token || '').trim();
  if (!responseToken) {
    return { ok: false, status: 400, error: 'Vui lòng hoàn tất xác minh bảo mật.' };
  }

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: responseToken,
        remoteip: ipAddress,
        idempotency_key: crypto.randomUUID()
      })
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.success) {
      return { ok: true };
    }
    console.warn('[turnstile]', result['error-codes'] || result);
    return { ok: false, status: 400, error: 'Xác minh Turnstile không hợp lệ. Vui lòng thử lại.' };
  } catch (err) {
    console.error('[turnstile]', err);
    return { ok: false, status: 503, error: 'Không thể xác minh Turnstile. Vui lòng thử lại sau.' };
  }
}

function validateAvatarPayload(value) {
  const avatar = String(value || '').trim();
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar) || avatar.startsWith('/api/media/')) return avatar.slice(0, 800);

  const match = avatar.match(/^data:([^;,]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match || !ALLOWED_AVATAR_DATA_URI_TYPES.has(match[1].toLowerCase())) {
    throw new PublicValidationError('Ảnh đại diện phải là ảnh JPEG, PNG, WEBP hoặc GIF hợp lệ.');
  }
  if (avatar.length > MAX_AVATAR_DATA_URI_LENGTH) {
    throw new PublicValidationError('Ảnh đại diện quá lớn. Vui lòng dùng ảnh nhỏ hơn 150KB.');
  }
  return avatar;
}

async function countActiveViewers(db) {
  const row = await db.prepare(
    "SELECT COUNT(*) AS count FROM viewer_presence WHERE lastSeenAt >= datetime('now', ?)"
  ).bind(`-${ACTIVE_VIEWER_WINDOW_SECONDS} seconds`).first();
  return Number(row?.count || 0);
}

async function ensureIncenseOfferingsSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS incense_offerings (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      viewerId TEXT NOT NULL,
      anniversaryKey TEXT NOT NULL,
      giftItems TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(memberId, viewerId, anniversaryKey),
      FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
    )
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_incense_offerings_member_key
    ON incense_offerings(memberId, anniversaryKey)
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_incense_offerings_created_at
    ON incense_offerings(createdAt)
  `).run();

  const info = await db.prepare("PRAGMA table_info(incense_offerings)").all();
  const hasGiftItems = (info.results || []).some((column) => column.name === 'giftItems');
  if (!hasGiftItems) {
    await db.prepare("ALTER TABLE incense_offerings ADD COLUMN giftItems TEXT").run();
  }
}

async function countIncenseOfferings(db, memberId, anniversaryKey) {
  const row = await db.prepare(
    "SELECT COUNT(*) AS count FROM incense_offerings WHERE memberId = ? AND anniversaryKey = ?"
  ).bind(memberId, anniversaryKey).first();
  return Number(row?.count || 0);
}

function buildMediaUrl(key = '') {
  return `/api/media/${String(key || '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
}

function normalizeHistoryImage(image = {}) {
  const key = safeDecodePath(String(image?.key || '').trim()).replace(/^\/+/, '');
  if (!key || key.includes('..')) return null;
  return {
    key,
    src: buildMediaUrl(key),
    name: String(image?.name || '').trim(),
    type: String(image?.type || '').trim(),
    size: Number(image?.size || 0)
  };
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64 = '') {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getAiConfigCryptoKey(secret) {
  const rawSecret = String(secret || '').trim();
  if (!rawSecret || rawSecret.length < 24) {
    throw new Error('AI_CONFIG_SECRET cần có ít nhất 24 ký tự để mã hóa API key.');
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawSecret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptAiApiKey(apiKey, secret) {
  const key = await getAiConfigCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(String(apiKey || '').trim())
  );

  return {
    version: 1,
    algorithm: 'AES-GCM',
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(cipherBuffer)
  };
}

async function decryptAiApiKey(encrypted, secret) {
  if (!encrypted?.iv || !encrypted?.data) {
    return '';
  }

  const key = await getAiConfigCryptoKey(secret);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToUint8Array(encrypted.iv) },
    key,
    base64ToUint8Array(encrypted.data)
  );
  return new TextDecoder().decode(plainBuffer);
}

function parseJsonFromModelText(text = '') {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('AI không trả về JSON dữ liệu gia phả.');
  }

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  const candidate = firstBrace >= 0 && lastBrace > firstBrace
    ? withoutFence.slice(firstBrace, lastBrace + 1)
    : withoutFence;

  return JSON.parse(candidate);
}

function buildMemberSyncAiSchema() {
  const optionalString = { type: ['string', 'null'] };
  const textString = { type: 'string' };

  return {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['giapha-tc-members'] },
      version: { type: 'number', enum: [1] },
      exportedAt: { type: 'string' },
      exportedBy: { type: 'string' },
      memberCount: { type: 'number' },
      members: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: textString,
            name: textString,
            gender: { type: 'string', enum: ['nam', 'nu'] },
            generation: { type: 'number' },
            isDeceased: { type: 'boolean' },
            birthDate: optionalString,
            deathDate: optionalString,
            birthPlace: textString,
            restingPlace: textString,
            occupation: textString,
            bio: textString,
            phone: textString,
            address: textString,
            avatar: textString,
            isFeatured: { type: 'boolean' },
            spouseIds: {
              type: 'array',
              items: { type: 'string' }
            },
            fatherId: optionalString,
            motherId: optionalString
          },
          required: [
            'id',
            'name',
            'gender',
            'generation',
            'isDeceased',
            'birthDate',
            'deathDate',
            'birthPlace',
            'restingPlace',
            'occupation',
            'bio',
            'phone',
            'address',
            'avatar',
            'isFeatured',
            'spouseIds',
            'fatherId',
            'motherId'
          ],
          additionalProperties: false
        }
      }
    },
    required: ['type', 'version', 'exportedAt', 'exportedBy', 'memberCount', 'members'],
    additionalProperties: false
  };
}

function extractOpenAiResponseText(response = {}) {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const chunks = [];
  (response.output || []).forEach((item) => {
    (item.content || []).forEach((content) => {
      if (typeof content.text === 'string') {
        chunks.push(content.text);
      }
      if (typeof content.output_text === 'string') {
        chunks.push(content.output_text);
      }
    });
  });
  return chunks.join('\n').trim();
}

function normalizeAiSourceFile(file) {
  if (typeof File === 'undefined' || !(file instanceof File) || file.size <= 0) {
    return null;
  }

  const type = String(file.type || '').toLowerCase();
  const name = sanitizeFileName(file.name || 'gia-pha-source');
  return {
    file,
    name,
    type,
    size: file.size
  };
}

async function uploadOpenAiUserFile(apiKey, source) {
  const form = new FormData();
  form.append('purpose', 'user_data');
  form.append('file', source.file, source.name || 'gia-pha-source.pdf');

  const response = await fetch(OPENAI_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Không thể tải PDF nguồn lên OpenAI.');
  }
  if (!data.id) {
    throw new Error('OpenAI không trả về file id cho PDF nguồn.');
  }
  return data.id;
}

async function deleteOpenAiFile(apiKey, fileId) {
  if (!fileId) return;
  await fetch(`${OPENAI_FILES_URL}/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }).catch(() => null);
}

async function buildAiSourceContent(apiKey, sources) {
  const uploadedFileIds = [];
  const content = [
    {
      type: 'input_text',
      text: [
        buildMemberSyncAiPrompt(),
        '',
        'Hãy đọc toàn bộ nguồn đính kèm trong request này. Nếu có nhiều ảnh/trang, hãy gộp thành một cây gia phả duy nhất.',
        'Trường memberCount phải đúng bằng số phần tử trong members. exportedAt dùng ISO timestamp hiện tại nếu không biết thời điểm nguồn.'
      ].join('\n')
    }
  ];

  for (const source of sources) {
    if (source.type === 'application/pdf') {
      const fileId = await uploadOpenAiUserFile(apiKey, source);
      uploadedFileIds.push(fileId);
      content.push({
        type: 'input_file',
        file_id: fileId
      });
      continue;
    }

    const buffer = await source.file.arrayBuffer();
    content.push({
      type: 'input_image',
      image_url: `data:${source.type};base64,${arrayBufferToBase64(buffer)}`
    });
  }

  return { content, uploadedFileIds };
}

async function callOpenAiMemberExtraction(apiKey, model, sources) {
  const { content, uploadedFileIds } = await buildAiSourceContent(apiKey, sources);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia nhập liệu gia phả Việt Nam. Chỉ trích xuất dữ liệu chắc chắn từ nguồn, không tự bịa quan hệ hoặc ngày tháng.'
          },
          {
            role: 'user',
            content
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'giapha_member_sync_import',
            schema: buildMemberSyncAiSchema(),
            strict: true
          }
        }
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error?.message || 'OpenAI không xử lý được nguồn gia phả.');
    }

    const text = extractOpenAiResponseText(data);
    if (!text) {
      throw new Error('OpenAI không trả về JSON dữ liệu gia phả.');
    }

    return parseJsonFromModelText(text);
  } finally {
    await Promise.all(uploadedFileIds.map((fileId) => deleteOpenAiFile(apiKey, fileId)));
  }
}

async function buildInlineSourceParts(sources) {
  const parts = [];
  for (const source of sources) {
    const buffer = await source.file.arrayBuffer();
    parts.push({
      source,
      base64: arrayBufferToBase64(buffer)
    });
  }
  return parts;
}

async function callGeminiMemberExtraction(apiKey, model, sources) {
  const inlineSources = await buildInlineSourceParts(sources);
  const response = await fetch(`${GEMINI_GENERATE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Bạn là chuyên gia nhập liệu gia phả Việt Nam. Chỉ trả về JSON thuần, không bọc Markdown.',
                buildMemberSyncAiPrompt(),
                'Hãy đọc toàn bộ ảnh/PDF đính kèm và gộp thành một cây gia phả duy nhất.'
              ].join('\n\n')
            },
            ...inlineSources.map((item) => ({
              inlineData: {
                mimeType: item.source.type,
                data: item.base64
              }
            }))
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini không xử lý được nguồn gia phả.');
  }

  const text = (data.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();
  return parseJsonFromModelText(text);
}

async function callClaudeMemberExtraction(apiKey, model, sources) {
  const inlineSources = await buildInlineSourceParts(sources);
  const content = [
    {
      type: 'text',
      text: [
        buildMemberSyncAiPrompt(),
        '',
        'Hãy đọc toàn bộ ảnh/PDF đính kèm và chỉ trả về JSON thuần, không bọc Markdown, không giải thích.'
      ].join('\n')
    },
    ...inlineSources.map((item) => {
      if (item.source.type === 'application/pdf') {
        return {
          type: 'document',
          source: {
            type: 'base64',
            media_type: item.source.type,
            data: item.base64
          }
        };
      }

      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: item.source.type,
          data: item.base64
        }
      };
    })
  ];

  const response = await fetch(CLAUDE_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': CLAUDE_API_VERSION
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: 'Bạn là chuyên gia nhập liệu gia phả Việt Nam. Không tự bịa dữ liệu, chỉ trích xuất thông tin đọc được từ nguồn.',
      messages: [
        {
          role: 'user',
          content
        }
      ]
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Claude không xử lý được nguồn gia phả.');
  }

  const text = (data.content || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();
  return parseJsonFromModelText(text);
}

async function callConfiguredAiMemberExtraction(config, apiKey, sources) {
  if (config.provider === 'gemini') {
    return callGeminiMemberExtraction(apiKey, config.model, sources);
  }
  if (config.provider === 'claude') {
    return callClaudeMemberExtraction(apiKey, config.model, sources);
  }
  return callOpenAiMemberExtraction(apiKey, config.model, sources);
}

async function resolveAiRuntimeConfig(c) {
  const storedConfig = await getStoredAiConfig(c.env.DB);
  const hasEnvOpenAiKey = Boolean(String(c.env.OPENAI_API_KEY || '').trim());
  let apiKey = '';

  if (storedConfig.encryptedApiKey) {
    apiKey = await decryptAiApiKey(storedConfig.encryptedApiKey, c.env.AI_CONFIG_SECRET);
  } else if (storedConfig.provider === 'openai' && hasEnvOpenAiKey) {
    apiKey = String(c.env.OPENAI_API_KEY || '').trim();
  }

  return {
    config: {
      ...storedConfig,
      model: storedConfig.model || getAiProviderConfig(storedConfig.provider).defaultModel
    },
    apiKey,
    hasEnvOpenAiKey
  };
}

async function testAiProviderKey(provider, apiKey) {
  if (provider === 'gemini') {
    const response = await fetch(`${GEMINI_MODELS_URL}?key=${encodeURIComponent(apiKey)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || 'Gemini API key chưa hợp lệ.');
    return;
  }

  if (provider === 'claude') {
    const response = await fetch(CLAUDE_MODELS_URL, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_API_VERSION
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || 'Claude API key chưa hợp lệ.');
    return;
  }

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI API key chưa hợp lệ.');
}

function getHistoryMediaItems(historyEvents = []) {
  const byKey = new Map();
  historyEvents.forEach((event) => {
    (event.images || []).forEach((image) => {
      if (image?.key && !byKey.has(image.key)) {
        byKey.set(image.key, image);
      }
    });
  });
  return Array.from(byKey.values());
}

async function replaceMembersFromSync(db, members = []) {
  const statements = [
    db.prepare("DELETE FROM members"),
    ...members.map((member) => db.prepare(`
      INSERT INTO members (
        id, name, gender, generation, isDeceased, birthDate, deathDate,
        birthPlace, restingPlace, occupation, bio, phone, address,
        avatar, isFeatured, spouseIds, fatherId, motherId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      member.id,
      member.name,
      member.gender,
      member.generation,
      member.isDeceased ? 1 : 0,
      member.birthDate || null,
      member.deathDate || null,
      member.birthPlace || '',
      member.restingPlace || '',
      member.occupation || '',
      member.bio || '',
      member.phone || '',
      member.address || '',
      member.avatar || null,
      member.isFeatured ? 1 : 0,
      JSON.stringify(member.spouseIds || []),
      member.fatherId || null,
      member.motherId || null
    ))
  ];

  await db.batch(statements);
}

async function replaceHistoryEventsFromPackage(db, historyEvents = []) {
  const statements = [
    db.prepare("DELETE FROM family_history_events"),
    ...historyEvents.map((event) => db.prepare(`
      INSERT INTO family_history_events (
        id, eventDate, title, description, relatedBranch, relatedMemberIds,
        imageUrls, isHomepageVisible, sortOrder, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      event.id,
      event.eventDate,
      event.title,
      event.description || '',
      event.relatedBranch || '',
      JSON.stringify(event.relatedMemberIds || []),
      JSON.stringify(event.images || []),
      event.isHomepageVisible ? 1 : 0,
      Number(event.sortOrder || 0)
    ))
  ];

  await db.batch(statements);
}

function getMediaKeyFromRequest(c) {
  return safeDecodePath(c.req.path.replace(/^\/(?:api\/)?media\//, '')).replace(/^\/+/, '');
}

async function deleteHistoryImagesFromBucket(c, images = []) {
  if (!c.env.MEDIA_BUCKET) return;
  const keys = images.map((image) => image?.key).filter(Boolean);
  await Promise.allSettled(keys.map((key) => c.env.MEDIA_BUCKET.delete(key)));
}

function buildEditorScopeIds(members, rootId) {
  if (!rootId) return null;
  const memberById = new Map(members.map((member) => [member.id, member]));
  if (!memberById.has(rootId)) return new Set();

  const relatedIdsByMemberId = new Map();
  const addRelation = (fromId, toId) => {
    if (!fromId || !toId) return;
    if (!relatedIdsByMemberId.has(fromId)) {
      relatedIdsByMemberId.set(fromId, new Set());
    }
    relatedIdsByMemberId.get(fromId).add(toId);
  };

  for (const member of members) {
    addRelation(member.fatherId, member.id);
    addRelation(member.motherId, member.id);
    for (const spouseId of member.spouseIds || []) {
      addRelation(member.id, spouseId);
      addRelation(spouseId, member.id);
    }
  }

  const scopeIds = new Set([rootId]);
  const queue = [rootId];

  for (let index = 0; index < queue.length; index += 1) {
    const currentId = queue[index];
    for (const relatedId of relatedIdsByMemberId.get(currentId) || []) {
      if (scopeIds.has(relatedId) || !memberById.has(relatedId)) continue;
      scopeIds.add(relatedId);
      queue.push(relatedId);
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
    const { username, password, turnstileToken } = await c.req.json();
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const ipAddress = getClientIp(c);
    if (!username || !password) {
      return c.json({ success: false, error: 'Vui lòng cung cấp đầy đủ tên tài khoản và mật khẩu.' }, 400);
    }

    if (await isLoginRateLimited(c.env.DB, ipAddress, normalizedUsername)) {
      await sleep(LOGIN_FAILURE_DELAY_MS);
      return c.json({ success: false, error: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.' }, 429);
    }

    const siteConfig = await getSiteConfig(c.env.DB);
    const turnstileResult = await verifyTurnstileIfEnabled(c, siteConfig, turnstileToken, ipAddress);
    if (!turnstileResult.ok) {
      await recordFailedLogin(c.env.DB, ipAddress, normalizedUsername);
      await sleep(LOGIN_FAILURE_DELAY_MS);
      return c.json({ success: false, error: turnstileResult.error }, turnstileResult.status);
    }

    const user = await c.env.DB.prepare(
      "SELECT username, password, role, fullName, editScopeRootId FROM users WHERE username = ? LIMIT 1"
    ).bind(normalizedUsername).first();

    if (!user) {
      await recordFailedLogin(c.env.DB, ipAddress, normalizedUsername);
      await sleep(LOGIN_FAILURE_DELAY_MS);
      return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      await recordFailedLogin(c.env.DB, ipAddress, normalizedUsername);
      await sleep(LOGIN_FAILURE_DELAY_MS);
      return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    await clearLoginAttempts(c.env.DB, ipAddress, normalizedUsername);

    if (passwordNeedsRehash(user.password)) {
      const upgradedHash = await hashPassword(password);
      await c.env.DB.prepare("UPDATE users SET password = ? WHERE username = ?")
        .bind(upgradedHash, user.username)
        .run();
    }

    // Create session
    const sessionId = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    const userAgent = String(c.req.header('user-agent') || '').slice(0, 240);

    await c.env.DB.prepare(
      "INSERT INTO sessions (id, username, role, expiresAt, ipAddress, userAgent) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(sessionId, user.username, user.role, expiresAt, ipAddress, userAgent).run();

    setCookie(c, 'session_id', sessionId, getSessionCookieOptions(c));

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
    console.error('[auth/login]', err);
    return c.json({ success: false, error: 'Đã xảy ra lỗi hệ thống.' }, 500);
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
    return serverError(c, 'api', err);
  }
});

// 4. GET /api/settings - Fetch public/private settings
app.get('/settings', async (c) => {
  try {
    const isPrivateMode = await getPrivateMode(c.env.DB);
    const siteConfig = await getSiteConfig(c.env.DB);
    return c.json({ success: true, privateMode: isPrivateMode, siteConfig });
  } catch (err) {
    return serverError(c, 'settings/get', err, { privateMode: true, siteConfig: parseSiteConfigValue() });
  }
});

// 5. POST /api/settings - Update settings (Admin only)
app.post('/settings', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const payload = await c.req.json();
    const hasPrivateMode = Object.prototype.hasOwnProperty.call(payload, 'privateMode');
    const hasSiteConfig = Object.prototype.hasOwnProperty.call(payload, 'siteConfig');
    const currentPrivateMode = await getPrivateMode(c.env.DB);
    const nextPrivateMode = hasPrivateMode ? Boolean(payload.privateMode) : currentPrivateMode;
    let nextSiteConfig = await getSiteConfig(c.env.DB);

    if (hasPrivateMode) {
      await c.env.DB.prepare(
        "INSERT INTO settings (key, value, updatedAt) VALUES ('private_mode', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt"
      ).bind(nextPrivateMode ? 'true' : 'false').run();
    }

    if (hasSiteConfig) {
      try {
        nextSiteConfig = validateSiteConfigInput(payload.siteConfig);
      } catch (error) {
        throw new PublicValidationError(error.message);
      }
      await c.env.DB.prepare(
        "INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt"
      ).bind(SITE_CONFIG_SETTING_KEY, serializeSiteConfig(nextSiteConfig)).run();
    }

    return c.json({ success: true, privateMode: nextPrivateMode, siteConfig: nextSiteConfig });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 6. POST /api/viewer-presence/heartbeat - Track active family tree viewers
app.post('/viewer-presence/heartbeat', async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    const isPrivateMode = await getPrivateMode(c.env.DB);
    if (isPrivateMode && !isAuthenticatedViewer(user)) {
      return c.json({ success: false, error: 'Bạn cần đăng nhập để ghi nhận trạng thái truy cập.' }, 401);
    }

    const payload = await c.req.json().catch(() => ({}));
    const viewerId = normalizeViewerId(payload.viewerId);
    if (!viewerId) {
      return c.json({ success: false, error: 'Viewer id không hợp lệ.' }, 400);
    }

    const ipAddress = getClientIp(c);
    await c.env.DB.prepare("DELETE FROM viewer_presence WHERE lastSeenAt < datetime('now', '-1 day')").run();
    const existingViewer = await c.env.DB.prepare("SELECT id FROM viewer_presence WHERE id = ? LIMIT 1").bind(viewerId).first();
    if (!existingViewer) {
      const activeForIp = await c.env.DB.prepare(
        "SELECT COUNT(*) AS count FROM viewer_presence WHERE ipAddress = ? AND lastSeenAt >= datetime('now', ?)"
      ).bind(ipAddress, `-${ACTIVE_VIEWER_WINDOW_SECONDS} seconds`).first();
      if (Number(activeForIp?.count || 0) >= VIEWER_PRESENCE_MAX_ACTIVE_PER_IP) {
        return c.json({ success: false, error: 'Quá nhiều phiên truy cập từ cùng một mạng.' }, 429);
      }
    }

    await c.env.DB.prepare(`
      INSERT INTO viewer_presence (id, userAgent, ipAddress, lastSeenAt, createdAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        userAgent = excluded.userAgent,
        ipAddress = excluded.ipAddress,
        lastSeenAt = excluded.lastSeenAt
    `).bind(
      viewerId,
      String(c.req.header('user-agent') || '').slice(0, 240),
      ipAddress
    ).run();

    return c.json({ success: true, activeViewers: await countActiveViewers(c.env.DB) });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 7. POST /api/viewer-presence/leave - Remove a viewer when the page closes
app.post('/viewer-presence/leave', async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    const isPrivateMode = await getPrivateMode(c.env.DB);
    if (isPrivateMode && !isAuthenticatedViewer(user)) {
      return c.json({ success: true, activeViewers: await countActiveViewers(c.env.DB) });
    }

    const payload = await c.req.json().catch(() => ({}));
    const viewerId = normalizeViewerId(payload.viewerId);
    if (!viewerId) {
      return c.json({ success: false, error: 'Viewer id không hợp lệ.' }, 400);
    }

    await c.env.DB.prepare("DELETE FROM viewer_presence WHERE id = ?").bind(viewerId).run();
    return c.json({ success: true, activeViewers: await countActiveViewers(c.env.DB) });
  } catch (err) {
    return serverError(c, 'api', err);
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
    return serverError(c, 'api', err);
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
    return serverError(c, 'api', err);
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
    if (username === ROOT_ADMIN_USERNAME && !isRootAdminUser(user)) {
      return c.json({ success: false, error: 'Chỉ admin gốc mới được sửa tài khoản admin gốc.' }, 403);
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
    return serverError(c, 'api', err);
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
    if (username === ROOT_ADMIN_USERNAME) {
      return c.json({ success: false, error: 'Không thể xóa tài khoản admin gốc.' }, 403);
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
    return serverError(c, 'api', err);
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
    const canRevealSensitiveInfo = isPrivateMode && canEditMembers(user);
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
    return serverError(c, 'api', err);
  }
});

// 11. GET /api/incense-offerings/:memberId - Count online incense offerings for a memorial
app.get('/incense-offerings/:memberId', async (c) => {
  try {
    await ensureIncenseOfferingsSchema(c.env.DB);
    const memberId = String(c.req.param('memberId') || '').trim();
    const anniversaryKey = normalizeIncenseKey(c.req.query('anniversaryKey'));
    if (!memberId || !anniversaryKey) {
      return c.json({ success: false, error: 'Thông tin ngày giỗ chưa hợp lệ.' }, 400);
    }

    const member = await c.env.DB.prepare("SELECT id FROM members WHERE id = ? LIMIT 1").bind(memberId).first();
    if (!member) {
      return c.json({ success: false, error: 'Không tìm thấy thành viên.' }, 404);
    }

    return c.json({
      success: true,
      count: await countIncenseOfferings(c.env.DB, memberId, anniversaryKey)
    });
  } catch (err) {
    return serverError(c, 'incense/count', err);
  }
});

// 12. POST /api/incense-offerings/:memberId - Offer incense anonymously or as a signed-in viewer
app.post('/incense-offerings/:memberId', async (c) => {
  try {
    await ensureIncenseOfferingsSchema(c.env.DB);
    const memberId = String(c.req.param('memberId') || '').trim();
    const payload = await c.req.json().catch(() => ({}));
    const viewerId = normalizeViewerId(payload.viewerId);
    const anniversaryKey = normalizeIncenseKey(payload.anniversaryKey);
    const giftItems = normalizeIncenseGiftItems(payload.giftItems);
    if (!memberId || !viewerId || !anniversaryKey) {
      return c.json({ success: false, error: 'Thông tin thắp hương chưa hợp lệ.' }, 400);
    }
    if (giftItems.length === 0) {
      return c.json({ success: false, error: 'Vui lòng chọn ít nhất một lễ vật.' }, 400);
    }

    const member = await c.env.DB.prepare("SELECT id FROM members WHERE id = ? LIMIT 1").bind(memberId).first();
    if (!member) {
      return c.json({ success: false, error: 'Không tìm thấy thành viên.' }, 404);
    }

    const id = generateSecureToken(18);
    const result = await c.env.DB.prepare(`
      INSERT OR IGNORE INTO incense_offerings (
        id, memberId, viewerId, anniversaryKey, giftItems, ipAddress, userAgent, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      memberId,
      viewerId,
      anniversaryKey,
      JSON.stringify(giftItems),
      getClientIp(c),
      String(c.req.header('user-agent') || '').slice(0, 240)
    ).run();

    return c.json({
      success: true,
      offered: Number(result.meta?.changes || 0) > 0,
      count: await countIncenseOfferings(c.env.DB, memberId, anniversaryKey)
    });
  } catch (err) {
    return serverError(c, 'incense/create', err);
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
    const avatar = validateAvatarPayload(data.avatar);

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
      avatar,
      data.isFeatured ? 1 : 0,
      JSON.stringify(data.spouseIds || []),
      data.fatherId || null,
      data.motherId || null
    ).run();

    // Sync spouse relationships bidirectionally
    await syncSpouseRelationships(c.env.DB, id, data.spouseIds || []);

    return c.json({ success: true, id });
  } catch (err) {
    return serverError(c, 'api', err);
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
    const avatar = validateAvatarPayload(data.avatar);

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
      avatar,
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
    return serverError(c, 'api', err);
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
    return serverError(c, 'api', err);
  }
});

// 14. GET /api/member-sync/export - Export the family tree members as JSON (Admin only)
app.get('/member-sync/export', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được xuất dữ liệu cây gia phả.' }, 403);
  }

  try {
    const members = await fetchFormattedMembers(c.env.DB);
    const payload = buildMemberSyncExport(members, {
      exportedBy: user.username || user.fullName || 'admin'
    });
    return jsonDownloadResponse(payload, buildMemberSyncFilename());
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 15. GET /api/member-sync/sample - Download a valid sample import file (Admin only)
app.get('/member-sync/sample', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được tải file mẫu đồng bộ.' }, 403);
  }

  return jsonDownloadResponse(buildMemberSyncSample(), 'giapha-members-sample.json');
});

// 16. GET /api/member-sync/ai-prompt - Download the AI extraction prompt (Admin only)
app.get('/member-sync/ai-prompt', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được tải prompt AI.' }, 403);
  }

  return textDownloadResponse(buildMemberSyncAiPrompt(), 'giapha-ai-import-prompt.txt');
});

// 17. GET /api/ai-config - Fetch safe AI provider configuration (Admin only)
app.get('/ai-config', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được xem cấu hình AI.' }, 403);
  }

  try {
    const config = await getStoredAiConfig(c.env.DB);
    return c.json({
      success: true,
      config: buildPublicAiConfig(config, {
        encryptionReady: Boolean(String(c.env.AI_CONFIG_SECRET || '').trim()),
        hasEnvApiKey: Boolean(String(c.env.OPENAI_API_KEY || '').trim())
      })
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 18. POST /api/ai-config - Save encrypted AI provider API key and model (Admin only)
app.post('/ai-config', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được sửa cấu hình AI.' }, 403);
  }

  try {
    const data = await c.req.json();
    const existing = await getStoredAiConfig(c.env.DB);
    const nextConfig = validateAiConfigInput(data, existing);
    const apiKey = String(data.apiKey || '').trim();
    const shouldClearApiKey = Boolean(data.clearApiKey);

    if (apiKey) {
      nextConfig.encryptedApiKey = await encryptAiApiKey(apiKey, c.env.AI_CONFIG_SECRET);
      nextConfig.keyPreview = buildKeyPreview(apiKey);
    } else if (shouldClearApiKey) {
      nextConfig.encryptedApiKey = null;
      nextConfig.keyPreview = '';
    } else if (existing.encryptedApiKey && existing.provider !== nextConfig.provider) {
      return c.json({ success: false, error: 'Khi đổi provider AI, vui lòng nhập API key mới hoặc chọn xóa key hiện tại.' }, 400);
    } else {
      nextConfig.encryptedApiKey = existing.encryptedApiKey || null;
      nextConfig.keyPreview = existing.keyPreview || '';
    }

    nextConfig.updatedAt = new Date().toISOString();
    await c.env.DB.prepare(
      "INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt"
    ).bind(AI_CONFIG_SETTING_KEY, serializeAiConfig(nextConfig)).run();

    return c.json({
      success: true,
      config: buildPublicAiConfig(nextConfig, {
        encryptionReady: Boolean(String(c.env.AI_CONFIG_SECRET || '').trim()),
        hasEnvApiKey: Boolean(String(c.env.OPENAI_API_KEY || '').trim())
      })
    });
  } catch (err) {
    return inputError(c, 'ai-config/save', err, 'Cấu hình AI chưa hợp lệ.');
  }
});

// 19. POST /api/ai-config/test - Validate the active or submitted AI API key (Admin only)
app.post('/ai-config/test', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được kiểm tra cấu hình AI.' }, 403);
  }

  try {
    const data = await c.req.json().catch(() => ({}));
    const existing = await getStoredAiConfig(c.env.DB);
    const provider = data.provider ? validateAiConfigInput(data, existing).provider : existing.provider;
    const submittedKey = String(data.apiKey || '').trim();
    let apiKey = submittedKey;

    if (!apiKey && existing.encryptedApiKey && existing.provider === provider) {
      apiKey = await decryptAiApiKey(existing.encryptedApiKey, c.env.AI_CONFIG_SECRET);
    }
    if (!apiKey && provider === 'openai') {
      apiKey = String(c.env.OPENAI_API_KEY || '').trim();
    }
    if (!apiKey) {
      return c.json({ success: false, error: 'Chưa có API key để kiểm tra.' }, 400);
    }

    await testAiProviderKey(provider, apiKey);
    return c.json({ success: true, message: 'Kết nối AI hợp lệ.' });
  } catch (err) {
    console.error('[ai-config/test]', err);
    return c.json({ success: false, error: 'Không kiểm tra được API key.' }, 400);
  }
});

// 17. POST /api/member-sync/ai-extract - Extract family tree members from image/PDF sources using OpenAI (Admin only)
app.post('/member-sync/ai-extract', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được dùng AI nhận diện gia phả.' }, 403);
  }

  try {
    const { config, apiKey } = await resolveAiRuntimeConfig(c);
    if (!apiKey) {
      return c.json({ success: false, error: 'Chưa cấu hình API key AI. Vào Quản trị > Cấu hình AI để lưu key trước.' }, 400);
    }

    const form = await c.req.formData();
    const sources = form.getAll('sources').map(normalizeAiSourceFile).filter(Boolean);

    if (!sources.length) {
      return c.json({ success: false, error: 'Vui lòng chọn ít nhất một ảnh hoặc PDF gia phả.' }, 400);
    }
    if (sources.length > AI_IMPORT_MAX_FILES) {
      return c.json({ success: false, error: `Chỉ hỗ trợ tối đa ${AI_IMPORT_MAX_FILES} file mỗi lần nhận diện.` }, 400);
    }

    const totalBytes = sources.reduce((sum, source) => sum + source.size, 0);
    if (totalBytes > AI_IMPORT_MAX_TOTAL_BYTES) {
      return c.json({ success: false, error: 'Tổng dung lượng nguồn AI tối đa là 24MB mỗi lần.' }, 400);
    }

    const invalidSource = sources.find((source) => !ALLOWED_AI_SOURCE_TYPES.has(source.type));
    if (invalidSource) {
      return c.json({ success: false, error: `File ${invalidSource.name} không đúng định dạng ảnh/PDF được hỗ trợ.` }, 400);
    }

    const oversizedSource = sources.find((source) => source.size > AI_IMPORT_MAX_FILE_BYTES);
    if (oversizedSource) {
      return c.json({ success: false, error: `File ${oversizedSource.name} vượt quá giới hạn 8MB.` }, 400);
    }

    const payload = await callConfiguredAiMemberExtraction(config, apiKey, sources);
    const incomingMembers = normalizeImportedMembers(payload);
    const relationResult = validateMemberRelations(incomingMembers);
    const existingMembers = await fetchFormattedMembers(c.env.DB);
    const preview = buildMemberSyncPreview(existingMembers, incomingMembers);

    return c.json({
      success: true,
      provider: config.provider,
      model: config.model,
      payload: {
        ...payload,
        memberCount: incomingMembers.length
      },
      valid: relationResult.valid,
      errors: relationResult.errors,
      preview
    });
  } catch (err) {
    console.error('AI member extraction error:', err);
    return serverError(c, 'ai/import', err);
  }
});

// 17. POST /api/member-sync/preview - Validate and preview a family tree import file (Admin only)
app.post('/member-sync/preview', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được kiểm tra file đồng bộ.' }, 403);
  }

  try {
    const payload = await c.req.json();
    const incomingMembers = normalizeImportedMembers(payload);
    const relationResult = validateMemberRelations(incomingMembers);
    const existingMembers = await fetchFormattedMembers(c.env.DB);
    const preview = buildMemberSyncPreview(existingMembers, incomingMembers);

    return c.json({
      success: true,
      valid: relationResult.valid,
      errors: relationResult.errors,
      preview
    });
  } catch (err) {
    return inputError(c, 'member-sync/preview', err, 'File đồng bộ chưa hợp lệ.');
  }
});

// 18. POST /api/member-sync/import - Replace production members from a validated JSON file (Admin only)
app.post('/member-sync/import', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được nhập dữ liệu cây gia phả.' }, 403);
  }

  try {
    const payload = await c.req.json();
    const incomingMembers = normalizeImportedMembers(payload);
    const relationResult = validateMemberRelations(incomingMembers);

    if (!relationResult.valid) {
      return c.json({
        success: false,
        error: 'File có quan hệ thành viên chưa hợp lệ.',
        errors: relationResult.errors
      }, 400);
    }

    const existingMembers = await fetchFormattedMembers(c.env.DB);
    const backup = buildMemberSyncExport(existingMembers, {
      exportedBy: `backup-before-import:${user.username || 'admin'}`,
      exportedAt: new Date().toISOString()
    });
    const preview = buildMemberSyncPreview(existingMembers, incomingMembers);

    await replaceMembersFromSync(c.env.DB, incomingMembers.map(normalizeMemberForSync));

    return c.json({
      success: true,
      message: 'Đã đồng bộ dữ liệu cây gia phả.',
      backup,
      backupFilename: buildMemberSyncFilename('backup-before-member-import'),
      preview
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 19. GET /api/cms-package/export - Export CMS settings, members, and history events (Admin only)
app.get('/cms-package/export', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được xuất gói CMS.' }, 403);
  }

  try {
    const [siteConfig, members, historyEvents] = await Promise.all([
      getSiteConfig(c.env.DB),
      fetchFormattedMembers(c.env.DB),
      fetchHistoryEvents(c.env.DB, true)
    ]);
    const payload = buildCmsPackage({
      siteConfig,
      members,
      historyEvents
    }, {
      exportedBy: user.username || user.fullName || 'admin'
    });

    return jsonDownloadResponse(payload, buildCmsPackageFilename());
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 20. POST /api/cms-package/preview - Validate and preview a CMS package import (Admin only)
app.post('/cms-package/preview', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được kiểm tra gói CMS.' }, 403);
  }

  try {
    const incoming = normalizeImportedCmsPackage(await c.req.json());
    const relationResult = validateCmsPackageRelations(incoming);
    const existing = {
      siteConfig: await getSiteConfig(c.env.DB),
      members: await fetchFormattedMembers(c.env.DB),
      historyEvents: await fetchHistoryEvents(c.env.DB, true)
    };
    const preview = buildCmsPackagePreview(existing, incoming);

    return c.json({
      success: true,
      valid: relationResult.valid,
      errors: relationResult.errors,
      preview
    });
  } catch (err) {
    return inputError(c, 'cms-package/preview', err, 'Gói CMS chưa hợp lệ.');
  }
});

// 21. POST /api/cms-package/import - Replace CMS settings, members, and history events (Admin only)
app.post('/cms-package/import', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được nhập gói CMS.' }, 403);
  }

  try {
    const incoming = normalizeImportedCmsPackage(await c.req.json());
    const relationResult = validateCmsPackageRelations(incoming);

    if (!relationResult.valid) {
      return c.json({
        success: false,
        error: 'Gói CMS có quan hệ dữ liệu chưa hợp lệ.',
        errors: relationResult.errors
      }, 400);
    }

    const existing = {
      siteConfig: await getSiteConfig(c.env.DB),
      members: await fetchFormattedMembers(c.env.DB),
      historyEvents: await fetchHistoryEvents(c.env.DB, true)
    };
    const backup = buildCmsPackage(existing, {
      exportedBy: `backup-before-cms-import:${user.username || 'admin'}`,
      exportedAt: new Date().toISOString()
    });
    const preview = buildCmsPackagePreview(existing, incoming);

    await c.env.DB.prepare(
      "INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt"
    ).bind(SITE_CONFIG_SETTING_KEY, serializeSiteConfig(incoming.siteConfig)).run();
    await replaceMembersFromSync(c.env.DB, incoming.members.map(normalizeMemberForSync));
    await replaceHistoryEventsFromPackage(c.env.DB, incoming.historyEvents);

    return c.json({
      success: true,
      message: 'Đã nhập gói CMS.',
      backup,
      backupFilename: buildCmsPackageFilename('backup-before-cms-import'),
      preview
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 22. GET /api/media-package/export - Export referenced R2 history media as JSON (Admin only)
app.get('/media-package/export', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được xuất gói media.' }, 403);
  }
  if (!c.env.MEDIA_BUCKET) {
    return c.json({ success: false, error: 'Chưa cấu hình R2 MEDIA_BUCKET.' }, 500);
  }

  try {
    const historyEvents = await fetchHistoryEvents(c.env.DB, true);
    const mediaRefs = getHistoryMediaItems(historyEvents);
    const missing = [];
    const media = [];

    for (const ref of mediaRefs) {
      const object = await c.env.MEDIA_BUCKET.get(ref.key);
      if (!object) {
        missing.push(ref.key);
        continue;
      }

      const buffer = await object.arrayBuffer();
      media.push({
        key: ref.key,
        name: ref.name || ref.key.split('/').pop(),
        contentType: object.httpMetadata?.contentType || ref.type || 'application/octet-stream',
        size: buffer.byteLength,
        base64: arrayBufferToBase64(buffer)
      });
    }

    const payload = {
      ...buildMediaPackage(media, {
        exportedBy: user.username || user.fullName || 'admin'
      }),
      missing
    };

    return jsonDownloadResponse(payload, buildMediaPackageFilename());
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 23. POST /api/media-package/preview - Validate and preview media package import (Admin only)
app.post('/media-package/preview', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được kiểm tra gói media.' }, 403);
  }

  try {
    const incoming = normalizeImportedMediaPackage(await c.req.json());
    const historyEvents = await fetchHistoryEvents(c.env.DB, true);
    const existingKeys = getHistoryMediaItems(historyEvents).map((image) => image.key);
    const preview = buildMediaPackagePreview(existingKeys, incoming.media);

    return c.json({
      success: true,
      valid: true,
      errors: [],
      preview
    });
  } catch (err) {
    return inputError(c, 'media-package/preview', err, 'Gói media chưa hợp lệ.');
  }
});

// 24. POST /api/media-package/import - Upload media package objects to R2 (Admin only)
app.post('/media-package/import', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Chỉ quản trị viên mới được nhập gói media.' }, 403);
  }
  if (!c.env.MEDIA_BUCKET) {
    return c.json({ success: false, error: 'Chưa cấu hình R2 MEDIA_BUCKET.' }, 500);
  }

  try {
    const incoming = normalizeImportedMediaPackage(await c.req.json());
    const historyEvents = await fetchHistoryEvents(c.env.DB, true);
    const existingKeys = getHistoryMediaItems(historyEvents).map((image) => image.key);
    const preview = buildMediaPackagePreview(existingKeys, incoming.media);

    await Promise.all(incoming.media.map((item) => c.env.MEDIA_BUCKET.put(
      item.key,
      base64ToUint8Array(item.base64),
      {
        httpMetadata: {
          contentType: item.contentType,
          cacheControl: 'public, max-age=31536000, immutable'
        },
        customMetadata: {
          originalName: item.name || item.key.split('/').pop() || item.key,
          importedBy: user.username || 'admin'
        }
      }
    )));

    return c.json({
      success: true,
      message: 'Đã nhập gói media.',
      imported: incoming.media.length,
      preview
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 25. GET /api/history-events - Fetch family history milestones
app.get('/history-events', async (c) => {
  try {
    const isPrivateMode = await getPrivateMode(c.env.DB);
    const user = await getAuthenticatedUser(c);

    if (isPrivateMode && !isAuthenticatedViewer(user)) {
      return c.json({ success: false, error: 'Chế độ riêng tư đang bật. Vui lòng đăng nhập tài khoản thành viên.' }, 403);
    }

    const includeHidden = c.req.query('includeHidden') === 'true' && isAdmin(user);
    const events = await fetchHistoryEvents(c.env.DB, includeHidden);
    return c.json({ success: true, data: events });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 20. GET /api/media/* - Serve private R2 media through the app access rules
app.get('/media/*', async (c) => {
  try {
    const isPrivateMode = await getPrivateMode(c.env.DB);
    const user = await getAuthenticatedUser(c);
    if (isPrivateMode && !isAuthenticatedViewer(user)) {
      return c.json({ success: false, error: 'Chế độ riêng tư đang bật. Vui lòng đăng nhập tài khoản thành viên.' }, 403);
    }

    if (!c.env.MEDIA_BUCKET) {
      return c.json({ success: false, error: 'Chưa cấu hình R2 MEDIA_BUCKET.' }, 500);
    }

    const key = getMediaKeyFromRequest(c);
    if (!key || key.includes('..')) {
      return c.json({ success: false, error: 'Đường dẫn ảnh không hợp lệ.' }, 400);
    }

    const object = await c.env.MEDIA_BUCKET.get(key);
    if (!object) {
      return c.json({ success: false, error: 'Không tìm thấy ảnh.' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', object.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 16. POST /api/history-images - Upload a family history image to R2 (Admin only)
app.post('/history-images', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }
  if (!c.env.MEDIA_BUCKET) {
    return c.json({ success: false, error: 'Chưa cấu hình R2 MEDIA_BUCKET.' }, 500);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return c.json({ success: false, error: 'Vui lòng chọn ảnh cần tải lên.' }, 400);
    }
    if (!ALLOWED_HISTORY_IMAGE_TYPES.has(file.type)) {
      return c.json({ success: false, error: 'Ảnh chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.' }, 400);
    }
    if (file.size > HISTORY_IMAGE_MAX_BYTES) {
      return c.json({ success: false, error: 'Ảnh sau khi nén cần nhỏ hơn 2MB.' }, 400);
    }

    const safeName = sanitizeFileName(file.name);
    const extension = safeName.includes('.') ? safeName.split('.').pop() : file.type.split('/').pop();
    const key = `history/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;
    const body = await file.arrayBuffer();

    await c.env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      customMetadata: {
        originalName: safeName,
        uploadedBy: user.username
      }
    });

    return c.json({
      success: true,
      image: {
        key,
        src: buildMediaUrl(key),
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 16b. POST /api/site-assets - Upload CMS visual assets such as logo, background, OGP image (Admin only)
app.post('/site-assets', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }
  if (!c.env.MEDIA_BUCKET) {
    return c.json({ success: false, error: 'Chưa cấu hình R2 MEDIA_BUCKET.' }, 500);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const scope = String(formData.get('scope') || 'site')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'site';

    if (!(file instanceof File)) {
      return c.json({ success: false, error: 'Vui lòng chọn ảnh cần tải lên.' }, 400);
    }
    if (!ALLOWED_SITE_ASSET_TYPES.has(file.type)) {
      return c.json({ success: false, error: 'Ảnh chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.' }, 400);
    }
    if (file.size > SITE_ASSET_MAX_BYTES) {
      return c.json({ success: false, error: 'Ảnh cần nhỏ hơn 4MB.' }, 400);
    }

    const safeName = sanitizeFileName(file.name || 'site-asset');
    const extension = safeName.includes('.') ? safeName.split('.').pop() : file.type.split('/').pop();
    const key = `site/${scope}/${crypto.randomUUID()}.${extension}`;
    const body = await file.arrayBuffer();

    await c.env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      customMetadata: {
        originalName: safeName,
        uploadedBy: user.username,
        purpose: 'site-config'
      }
    });

    return c.json({
      success: true,
      asset: {
        key,
        src: buildMediaUrl(key),
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 17. POST /api/history-events - Create a family history milestone (Admin only)
app.post('/history-events', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  try {
    const payload = normalizeHistoryEventPayload(await c.req.json());
    if (payload.error) {
      return c.json({ success: false, error: payload.error }, 400);
    }

    const id = `history_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO family_history_events (
        id, eventDate, title, description, relatedBranch, relatedMemberIds,
        imageUrls, isHomepageVisible, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      payload.eventDate,
      payload.title,
      payload.description,
      payload.relatedBranch,
      JSON.stringify(payload.relatedMemberIds),
      JSON.stringify(payload.images),
      payload.isHomepageVisible ? 1 : 0,
      payload.sortOrder
    ).run();

    return c.json({ success: true, id });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 18. PUT /api/history-events/:id - Update a family history milestone (Admin only)
app.put('/history-events/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  const eventId = c.req.param('id');

  try {
    const existing = await c.env.DB.prepare("SELECT id, imageUrls FROM family_history_events WHERE id = ? LIMIT 1").bind(eventId).first();
    if (!existing) {
      return c.json({ success: false, error: 'Không tìm thấy cột mốc lịch sử.' }, 404);
    }

    const payload = normalizeHistoryEventPayload(await c.req.json());
    if (payload.error) {
      return c.json({ success: false, error: payload.error }, 400);
    }

    const previousImages = parseJsonArray(existing.imageUrls);
    const nextKeys = new Set(payload.images.map((image) => image.key));
    const removedImages = previousImages.filter((image) => image.key && !nextKeys.has(image.key));

    await c.env.DB.prepare(`
      UPDATE family_history_events SET
        eventDate = ?, title = ?, description = ?, relatedBranch = ?, relatedMemberIds = ?, imageUrls = ?,
        isHomepageVisible = ?, sortOrder = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      payload.eventDate,
      payload.title,
      payload.description,
      payload.relatedBranch,
      JSON.stringify(payload.relatedMemberIds),
      JSON.stringify(payload.images),
      payload.isHomepageVisible ? 1 : 0,
      payload.sortOrder,
      eventId
    ).run();

    await deleteHistoryImagesFromBucket(c, removedImages);

    return c.json({ success: true, id: eventId });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

// 19. DELETE /api/history-events/:id - Delete a family history milestone (Admin only)
app.delete('/history-events/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!isAdmin(user)) {
    return c.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, 403);
  }

  const eventId = c.req.param('id');

  try {
    const existing = await c.env.DB.prepare("SELECT imageUrls FROM family_history_events WHERE id = ? LIMIT 1").bind(eventId).first();
    if (!existing) {
      return c.json({ success: false, error: 'Không tìm thấy cột mốc lịch sử.' }, 404);
    }

    await c.env.DB.prepare("DELETE FROM family_history_events WHERE id = ?").bind(eventId).run();
    await deleteHistoryImagesFromBucket(c, parseJsonArray(existing.imageUrls));
    return c.json({ success: true });
  } catch (err) {
    return serverError(c, 'api', err);
  }
});

export const onRequest = handle(app);
