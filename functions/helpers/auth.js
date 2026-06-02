// functions/helpers/auth.js
// Utility helpers for password hashing and safe string comparisons using Web Crypto API.

const PBKDF2_ITERATIONS = 50000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_LENGTH = 256; // bits (32 bytes)

export function timingSafeStringEqual(a, b) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(String(a || ''));
  const bBytes = encoder.encode(String(b || ''));
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }
  return diff === 0;
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const matches = hex.match(/.{2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_LENGTH
  );
  return toHex(new Uint8Array(derivedBits));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  return `pbkdf2:${toHex(salt)}:${hash}`;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.startsWith('pbkdf2:')) {
    console.error('[auth] Plaintext passwords rejected');
    return false;
  }
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const salt = fromHex(parts[1]);
  const expectedHash = parts[2];
  const hash = await deriveKey(password, salt);
  return timingSafeStringEqual(hash, expectedHash);
}

export function generateSecureToken(length = 48) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
