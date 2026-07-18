import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createDeviceSession,
  readDeviceSession,
  sessionCookie,
} from '../lib/session.js';

const secret = 'test-session-secret-with-at-least-32-characters';

test('device sessions are encrypted, expire, and reject tampering', () => {
  const now = 1_700_000_000_000;
  const issued = createDeviceSession({ secret, now, deviceId: 'device-1' });

  assert.equal(issued.token.includes('device-1'), false);
  assert.deepEqual(readDeviceSession(issued.token, { secret, now }), {
    version: 1,
    deviceId: 'device-1',
    issuedAt: now,
    expiresAt: issued.expiresAt,
  });
  assert.equal(readDeviceSession(issued.token, { secret, now: issued.expiresAt }), null);
  const tampered = `${issued.token.slice(0, -1)}${issued.token.endsWith('A') ? 'B' : 'A'}`;
  assert.equal(readDeviceSession(tampered, { secret, now }), null);
  assert.equal(readDeviceSession(issued.token, { secret: `${secret}-wrong`, now }), null);
});

test('session cookies use a protected host scope and are clearable', () => {
  const cookie = sessionCookie('encrypted-token', 3600);
  assert.equal(SESSION_COOKIE, '__Host-token-pulse-session');
  assert.match(cookie, new RegExp(`^${SESSION_COOKIE}=encrypted-token;`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\//);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.match(cookie, /Max-Age=3600/);

  const cleared = clearSessionCookie();
  assert.match(cleared, new RegExp(`^${SESSION_COOKIE}=;`));
  assert.match(cleared, /Max-Age=0/);
  assert.match(cleared, /HttpOnly/);
  assert.match(cleared, /Secure/);
  assert.match(cleared, /Path=\//);
  assert.doesNotMatch(cleared, /Domain=/i);
});

test('session creation rejects weak or missing encryption secrets', () => {
  assert.throws(() => createDeviceSession({ secret: 'short' }), /SESSION_SECRET/);
  assert.throws(() => createDeviceSession({ secret: '' }), /SESSION_SECRET/);
});
