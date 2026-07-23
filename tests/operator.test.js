import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePost as handleLogin } from '../app/api/session/route.js';
import { handleGet } from '../app/api/operator/route.js';
import { operatorWorkbench } from '../lib/operator-data.js';
import { filterPlaybooks, isOperatorReadySurface } from '../lib/operator-ui.js';

const login = accessKey => new Request('https://example.test/api/session', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ accessKey }),
});

const operatorRequest = (cookie = '') => new Request('https://example.test/api/operator', {
  headers: cookie ? { cookie } : {},
});

test.beforeEach(() => {
  process.env.DASHBOARD_TOKEN = 'dashboard';
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
});

test('operator API is private and returns a no-store product contract', async () => {
  assert.equal((await handleGet(operatorRequest())).status, 401);

  const loginResponse = await handleLogin(login('dashboard'), {
    deviceId: () => 'device-operator-test',
  });
  const cookie = loginResponse.headers.get('set-cookie').split(';', 1)[0];
  const response = await handleGet(operatorRequest(cookie));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = await response.json();
  assert.equal(body.product, 'Operator Workbench');
  assert.deepEqual(body.loop, ['Signal', 'Playbook', 'Evidence', 'Approval', 'Result']);
  assert.equal(body.surfaces.length, 3);
  assert.equal(body.playbooks.length, 8);
});

test('operator API opens without a key only for the local development path', async () => {
  const localRequest = new Request('http://127.0.0.1:3017/api/operator');
  const response = await handleGet(localRequest, { localAccess: () => true });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).accessMode, 'local');
});

test('playbooks expose source, approval, proof, and success contracts', () => {
  for (const playbook of operatorWorkbench.playbooks) {
    assert.ok(playbook.trigger.length > 10, `${playbook.id} needs a trigger`);
    assert.ok(playbook.sources.length > 0, `${playbook.id} needs sources`);
    assert.ok(playbook.steps.length > 2, `${playbook.id} needs operating steps`);
    assert.match(playbook.approval, /approv|allowed|safe|required/i, `${playbook.id} needs an approval boundary`);
    assert.ok(playbook.proof.length > 10, `${playbook.id} needs proof of done`);
    assert.ok(playbook.success.length > 10, `${playbook.id} needs a success measure`);
    assert.ok(playbook.prompt.length > 100, `${playbook.id} needs an exact operator prompt`);
  }
});

test('operator view recognizes the shared authenticated dashboard surface', () => {
  assert.equal(isOperatorReadySurface('dashboard'), true);
  assert.equal(isOperatorReadySurface('ready'), false);
  assert.equal(isOperatorReadySurface('locked'), false);
});

test('work and personal filters stay distinct and search uses tools and outcomes', () => {
  assert.equal(filterPlaybooks(operatorWorkbench.playbooks, { category: 'Work' }).length, 6);
  assert.equal(filterPlaybooks(operatorWorkbench.playbooks, { category: 'Personal' }).length, 2);
  assert.deepEqual(
    filterPlaybooks(operatorWorkbench.playbooks, { query: 'PulseMark' }).map(item => item.id),
    ['growth-experiment-review', 'proof-led-content'],
  );
  assert.deepEqual(
    filterPlaybooks(operatorWorkbench.playbooks, { query: 'leaving the workstation' }).map(item => item.id),
    ['leave-the-desk-safely'],
  );
});

test('MVP does not imply remote execution or publication', () => {
  const serialized = JSON.stringify(operatorWorkbench).toLowerCase();
  assert.match(serialized, /read-only/);
  assert.match(serialized, /do not publish|publishing requires|approve every public post/);
  assert.doesNotMatch(serialized, /auto-publish|run now|executed successfully/);
});
