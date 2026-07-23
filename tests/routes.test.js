import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePost } from '../app/api/ingest/route.js';
import { handleGet } from '../app/api/snapshot/route.js';
import { handlePost as handleLogin } from '../app/api/session/route.js';
import { handlePost as handleLogout } from '../app/api/session/logout/route.js';
import { isLocalDashboardRequest, SESSION_COOKIE } from '../lib/session.js';
import { createLoginRateLimiter } from '../lib/login-rate-limit.js';

const snapshot = { schema: 1, fetchedAt: 1, period: 'Today', dateKey: '2026-07-17', total: 10, input: 8, output: 2, cacheRead: 0, cacheHitRate: 0, activeSessions: 0, sessions: 1, platforms: [] };
const post = (body, token = 'sync') => new Request('https://example.test/api/ingest', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const get = (cookie = '') => new Request('https://example.test/api/snapshot', { headers: cookie ? { cookie } : {} });
const login = accessKey => new Request('https://example.test/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accessKey }) });

test.beforeEach(() => {
  process.env.SYNC_TOKEN = 'sync';
  process.env.DASHBOARD_TOKEN = 'dashboard';
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
});

test('unauthorized ingest does not parse or write attacker input', async () => {
  let writes = 0;
  const response = await handlePost(post('{malformed', 'wrong'), { write: async () => { writes++; } });
  assert.equal(response.status, 401);
  assert.equal(writes, 0);
});

test('authorized ingest rejects malformed input and stores only normalized fields', async () => {
  assert.equal((await handlePost(post('{bad'))).status, 400);
  let stored;
  const response = await handlePost(post({ ...snapshot, secret: 'must-not-store' }), { write: async value => { stored = value; }, now: () => 42 });
  assert.equal(response.status, 200);
  assert.equal(stored.receivedAt, 42);
  assert.equal('secret' in stored, false);
});

test('ingest converts storage failure into an explainable 503', async () => {
  const response = await handlePost(post(snapshot), { write: async () => { throw new Error('blob down'); } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Snapshot storage unavailable' });
});

test('login exchanges the dashboard key for a protected cookie without echoing the key', async () => {
  assert.equal((await handleLogin(login('wrong'))).status, 401);
  const response = await handleLogin(login('dashboard'), { now: () => 1_700_000_000_000, deviceId: () => 'device-1' });
  assert.equal(response.status, 204);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, new RegExp(`^${SESSION_COOKIE}=`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(cookie.includes('dashboard'), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('login throttles repeated client failures with Retry-After and a secret-free audit event', async () => {
  const limiter = createLoginRateLimiter({ windowMs: 60_000, perClientLimit: 2, globalLimit: 10 });
  const request = key => new Request('https://example.test/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '192.0.2.8' },
    body: JSON.stringify({ accessKey: key }),
  });
  const events = [];
  const options = { limiter, now: () => 1000, audit: message => events.push(JSON.parse(message)) };
  assert.equal((await handleLogin(request('wrong-1'), options)).status, 401);
  assert.equal((await handleLogin(request('wrong-2'), options)).status, 401);
  const blocked = await handleLogin(request('dashboard'), options);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '60');
  assert.deepEqual(events, [{ event: 'dashboard_auth_throttled', scope: 'client', retryAfter: 60 }]);
  assert.equal(JSON.stringify(events).includes('wrong-1'), false);
  assert.equal(JSON.stringify(events).includes('wrong-2'), false);
});

test('snapshot requires a device session while retaining the native bearer compatibility path', async () => {
  const wrongBearer = new Request('https://example.test/api/snapshot', { headers: { authorization: 'Bearer wrong' } });
  assert.equal((await handleGet(wrongBearer, { read: async () => snapshot })).status, 401);
  const nativeBearer = new Request('https://example.test/api/snapshot', { headers: { authorization: 'Bearer dashboard' } });
  assert.equal((await handleGet(nativeBearer, { read: async () => snapshot })).status, 200);

  const loginResponse = await handleLogin(login('dashboard'));
  const cookie = loginResponse.headers.get('set-cookie').split(';', 1)[0];
  assert.equal((await handleGet(get(`${SESSION_COOKIE}=tampered`), { read: async () => snapshot })).status, 401);
  assert.equal((await handleGet(get(cookie), { read: async () => null })).status, 404);
  assert.equal((await handleGet(get(cookie), { read: async () => { throw new Error('corrupt'); } })).status, 503);
  const response = await handleGet(get(cookie), { read: async () => snapshot });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), snapshot);
});

test('localhost development requests need no key while production and remote requests stay private', async () => {
  const local = new Request('http://127.0.0.1:3017/api/snapshot');
  const remote = new Request('https://example.test/api/snapshot');
  assert.equal(isLocalDashboardRequest(local, { environment: 'development' }), true);
  assert.equal(isLocalDashboardRequest(local, { environment: 'production' }), false);
  assert.equal(isLocalDashboardRequest(local, { environment: 'production', localNoAuth: '1' }), true);
  assert.equal(isLocalDashboardRequest(remote, { environment: 'development' }), false);

  const response = await handleGet(local, { read: async () => snapshot, localAccess: () => true });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ...snapshot, accessMode: 'local' });
});

test('logout expires the protected session cookie', async () => {
  const response = await handleLogout();
  assert.equal(response.status, 204);
  assert.match(response.headers.get('set-cookie'), new RegExp(`^${SESSION_COOKIE}=;`));
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('parallel ingests keep request data isolated', async () => {
  const stored = [];
  const write = async value => { await new Promise(resolve => setTimeout(resolve, value.total === 1 ? 10 : 0)); stored.push(value); };
  const [first, second] = await Promise.all([
    handlePost(post({ ...snapshot, total: 1 }), { write, now: () => 1 }),
    handlePost(post({ ...snapshot, total: 2 }), { write, now: () => 2 }),
  ]);
  assert.deepEqual([first.status, second.status], [200, 200]);
  assert.deepEqual(stored.map(value => value.total).sort(), [1, 2]);
});
