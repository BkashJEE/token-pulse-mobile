import test from 'node:test';
import assert from 'node:assert/strict';

import { handleGet } from '../app/api/growth/route.js';
import { createDeviceSession, SESSION_COOKIE } from '../lib/session.js';
import { growthSnapshot } from '../lib/growth-data.js';

const secret = 'test-session-secret-with-at-least-32-characters';

test.beforeEach(() => {
  process.env.SESSION_SECRET = secret;
});

test('growth endpoint rejects requests without a private device session', async () => {
  const request = new Request('https://example.test/api/growth');
  const response = await handleGet(request);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('growth endpoint opens without a key on the local development path', async () => {
  const request = new Request('http://localhost:3017/api/growth');
  const response = await handleGet(request, { localAccess: () => true });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.accessMode, 'local');
  assert.equal(body.account, '@BkashJosi');
});

test('growth endpoint returns the verified 10K mission without public caching', async () => {
  const now = Date.now();
  const { token } = createDeviceSession({ secret, now, deviceId: 'growth-test' });
  const request = new Request('https://example.test/api/growth', {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  });
  const response = await handleGet(request);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(body.mission, { current: 185, target: 10000, remaining: 9815, progress: 1.85 });
  assert.deepEqual(body.gate, { score: 67, maximum: 100, decision: 'HOLD' });
});

test('mobile consolidation preserves all ten workbook sections', () => {
  assert.equal(growthSnapshot.workbookMap.length, 10);
  assert.deepEqual(growthSnapshot.workbookMap.map(item => item[0]), [
    'Executive Dashboard', 'Format Analysis', 'Algorithm Gate', 'Post Tracker',
    'Competitor Tracker', '10K Growth Plan', 'Experiment Tracker',
    'Raw Analytics to Jul12', 'Metric Dictionary', 'Sources & Decisions',
  ]);
});

test('growth UI does not flash the access form while restoring or creating a session', async () => {
  const { resolveGrowthSurface } = await import('../lib/growth-ui.js');
  assert.equal(resolveGrowthSurface('checking', false), 'loading');
  assert.equal(resolveGrowthSurface('unlocking', false), 'loading');
  assert.equal(resolveGrowthSurface('loading', false), 'loading');
  assert.equal(resolveGrowthSurface('locked', false), 'locked');
  assert.equal(resolveGrowthSurface('ready', true), 'dashboard');
  assert.equal(resolveGrowthSurface('unavailable', false), 'unavailable');
  assert.equal(resolveGrowthSurface('locking', false), 'locked');
});

test('growth client preserves the session surface for service failures and locks only on 401', async () => {
  const { requestGrowth } = await import('../lib/growth-ui.js');
  assert.deepEqual(await requestGrowth(async () => new Response(null, { status: 401 })), { kind: 'locked' });
  assert.deepEqual(await requestGrowth(async () => new Response(null, { status: 503 })), { kind: 'unavailable' });
  assert.deepEqual(await requestGrowth(async () => { throw new Error('offline'); }), { kind: 'unavailable' });
  assert.deepEqual(await requestGrowth(async () => new Response(JSON.stringify({ mission: '10K' }), { status: 200 })), { kind: 'ready', data: { mission: '10K' } });
});

test('growth client confirms server logout instead of treating failures as locked', async () => {
  const { closeGrowthSession } = await import('../lib/growth-ui.js');
  assert.equal(await closeGrowthSession(async () => new Response(null, { status: 204 })), true);
  assert.equal(await closeGrowthSession(async () => new Response(null, { status: 503 })), false);
  assert.equal(await closeGrowthSession(async () => { throw new Error('offline'); }), false);
});

test('unlock posts only to the session exchange, then loads growth with same-origin credentials', async () => {
  const { openGrowthSession } = await import('../lib/growth-ui.js');
  const calls = [];
  const storage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new Proxy({}, { get() { throw new Error('Web Storage must not be touched'); } }) });
  try {
    const result = await openGrowthSession('private-key', async (url, options) => {
      calls.push({ url, options });
      if (url === '/api/session') return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ mission: '10K' }), { status: 200 });
    });
    assert.deepEqual(result, { kind: 'ready', data: { mission: '10K' } });
    assert.deepEqual(calls.map(call => call.url), ['/api/session', '/api/growth']);
    assert.equal(calls[0].options.credentials, 'same-origin');
    assert.deepEqual(JSON.parse(calls[0].options.body), { accessKey: 'private-key' });
    assert.equal(calls[1].options.credentials, 'same-origin');
  } finally {
    if (storage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  }
});

test('locked UI renders an alert and retry action for unconfirmed server logout', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { LockWarning } = await import('../lib/lock-warning.js');
  const markup = renderToStaticMarkup(createElement(LockWarning, {
    message: 'The server session could not be closed.',
    onRetry() {},
  }));
  assert.match(markup, /role="alert"/);
  assert.match(markup, /The server session could not be closed\./);
  assert.match(markup, />Retry lock<\/button>/);
});

test('session controller hides private data before failed logout resolves and clears warning after retry', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createElement } = await import('react');
  const { create, act } = await import('react-test-renderer');
  const { GrowthSessionController } = await import('../lib/growth-session-controller.js');
  let view;
  let finishFirstClose;
  let closeCalls = 0;
  const firstClose = new Promise(resolve => { finishFirstClose = resolve; });
  const Probe = props => { view = props; return createElement('output', { 'data-surface': props.surface }); };

  let renderer;
  await act(async () => {
    renderer = create(createElement(GrowthSessionController, {
      request: async () => ({ kind: 'ready', data: { private: 'dashboard-data' } }),
      close: async () => (++closeCalls === 1 ? firstClose : true),
    }, Probe));
  });
  assert.equal(view.surface, 'dashboard');
  assert.deepEqual(view.data, { private: 'dashboard-data' });

  let lockAttempt;
  act(() => { lockAttempt = view.lock(); });
  assert.equal(view.data, null);
  assert.equal(view.surface, 'locked');
  assert.equal(view.lockError, '');

  finishFirstClose(false);
  await act(async () => { await lockAttempt; });
  assert.match(view.lockError, /session cookie could not be cleared/);

  await act(async () => { await view.lock(); });
  assert.equal(view.lockError, '');
  assert.equal(view.surface, 'locked');
  await act(async () => { renderer.unmount(); });
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
