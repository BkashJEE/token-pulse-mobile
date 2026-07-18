import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePost } from '../app/api/ingest/route.js';
import { handleGet } from '../app/api/snapshot/route.js';

const snapshot = { schema: 1, fetchedAt: 1, period: 'Today', dateKey: '2026-07-17', total: 10, input: 8, output: 2, cacheRead: 0, cacheHitRate: 0, activeSessions: 0, sessions: 1, platforms: [] };
const post = (body, token = 'sync') => new Request('https://example.test/api/ingest', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const get = (token = 'dashboard') => new Request('https://example.test/api/snapshot', { headers: { authorization: `Bearer ${token}` } });

test.beforeEach(() => { process.env.SYNC_TOKEN = 'sync'; process.env.DASHBOARD_TOKEN = 'dashboard'; });

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

test('snapshot route distinguishes unauthorized, empty, corrupt, and healthy storage', async () => {
  assert.equal((await handleGet(get('wrong'), { read: async () => snapshot })).status, 401);
  assert.equal((await handleGet(get(), { read: async () => null })).status, 404);
  assert.equal((await handleGet(get(), { read: async () => { throw new Error('corrupt'); } })).status, 503);
  const response = await handleGet(get(), { read: async () => snapshot });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), snapshot);
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
