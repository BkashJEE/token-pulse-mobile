import crypto from 'node:crypto';

// The __Host- prefix prevents Domain scoping and path shadowing in supporting browsers.
// It requires Secure, Path=/, and no Domain attribute, which sessionCookie() enforces.
export const SESSION_COOKIE = '__Host-token-pulse-session';
export const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const MAX_SECRET_LENGTH = 4096;
const MAX_TOKEN_LENGTH = 4096;

function encryptionKey(secret) {
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH || secret.length > MAX_SECRET_LENGTH) {
    throw new Error('SESSION_SECRET must be between 32 and 4096 characters');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

export function createDeviceSession({
  secret = process.env.SESSION_SECRET,
  now = Date.now(),
  deviceId = crypto.randomUUID(),
  durationSeconds = SESSION_DURATION_SECONDS,
} = {}) {
  const issuedAt = Number(now);
  if (!Number.isFinite(issuedAt) || typeof deviceId !== 'string' || !deviceId || deviceId.length > 128) {
    throw new Error('Invalid device session parameters');
  }
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 60 || durationSeconds > 7 * 24 * 60 * 60) {
    throw new Error('Invalid device session duration');
  }

  const expiresAt = issuedAt + durationSeconds * 1000;
  const payload = JSON.stringify({ version: 1, deviceId, issuedAt, expiresAt });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const token = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
  return { token, expiresAt, deviceId };
}

export function readDeviceSession(token, { secret = process.env.SESSION_SECRET, now = Date.now() } = {}) {
  try {
    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const packed = Buffer.from(token, 'base64url');
    if (packed.toString('base64url') !== token || packed.length < 29) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(secret), packed.subarray(0, 12));
    decipher.setAuthTag(packed.subarray(12, 28));
    const payload = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8'));
    const currentTime = Number(now);
    if (
      payload?.version !== 1 ||
      typeof payload.deviceId !== 'string' || !payload.deviceId || payload.deviceId.length > 128 ||
      !Number.isFinite(payload.issuedAt) || !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= payload.issuedAt || !Number.isFinite(currentTime) || currentTime < payload.issuedAt || currentTime >= payload.expiresAt
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requestSessionToken(request) {
  const header = request.headers.get('cookie') || '';
  if (header.length > 8192) return '';
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === SESSION_COOKIE) return part.slice(separator + 1).trim();
  }
  return '';
}

export function readRequestSession(request, options) {
  return readDeviceSession(requestSessionToken(request), options);
}

export function sessionCookie(token, maxAge = SESSION_DURATION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
