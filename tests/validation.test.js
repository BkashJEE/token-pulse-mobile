import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSnapshot, readJsonBody } from '../lib/validation.js';

const valid = () => ({ schema: 1, fetchedAt: 1, period: 'Today', dateKey: '2026-07-17', total: 10, input: 8, output: 2, cacheRead: 0, cacheHitRate: 0, activeSessions: 1, sessions: 1, platforms: [] });

test('readJsonBody rejects declared and streamed resource exhaustion before parsing', async () => {
  const declared = new Request('https://example.test', { method: 'POST', headers: { 'content-length': '250001' }, body: '{}' });
  assert.deepEqual(await readJsonBody(declared), { error: 'Snapshot too large', status: 413 });
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(200_000)); controller.enqueue(new Uint8Array(60_000)); controller.close(); } });
  const chunked = new Request('https://example.test', { method: 'POST', body: stream, duplex: 'half' });
  assert.deepEqual(await readJsonBody(chunked), { error: 'Snapshot too large', status: 413 });
});

test('readJsonBody rejects malformed JSON and invalid UTF-8', async () => {
  const malformed = new Request('https://example.test', { method: 'POST', body: '{oops' });
  assert.deepEqual(await readJsonBody(malformed), { error: 'Invalid JSON', status: 400 });
  const invalid = new Request('https://example.test', { method: 'POST', body: new Uint8Array([0xff]) });
  assert.deepEqual(await readJsonBody(invalid), { error: 'Invalid JSON', status: 400 });
});

test('normalizeSnapshot strips unknown and secret-shaped fields at every level', () => {
  const input = valid();
  input.secret = 'top';
  input.alerts = [{ id: 'a', severity: 'critical', title: 'Quota', detail: 'x', action: 'Switch', rawPrompt: 'secret' }];
  input.platforms = [{ id: 'codex', label: 'Codex', connected: true, total: 10, token: 'secret', quota: { available: true, remainingPercent: 110, apiKey: 'secret' }, activeSessionList: [{ id: 's', title: 'Task', prompt: 'secret', total: 10 }] }];
  const result = normalizeSnapshot(input);
  assert.equal('secret' in result, false);
  assert.equal('token' in result.platforms[0], false);
  assert.equal('apiKey' in result.platforms[0].quota, false);
  assert.equal('prompt' in result.platforms[0].activeSessionList[0], false);
  assert.equal('rawPrompt' in result.alerts[0], false);
  assert.equal(result.alerts[0].severity, 'critical');
  assert.equal(result.platforms[0].quota.remainingPercent, 100);
});

test('normalizeSnapshot rejects wrong schema, non-finite totals, and cardinality abuse', () => {
  assert.equal(normalizeSnapshot({ ...valid(), schema: 2 }), null);
  assert.equal(normalizeSnapshot({ ...valid(), total: Infinity }), null);
  assert.equal(normalizeSnapshot({ ...valid(), platforms: Array.from({ length: 21 }, () => ({})) }), null);
  assert.equal(normalizeSnapshot({ ...valid(), platforms: [{ activeSessionList: Array.from({ length: 13 }, () => ({})) }] }), null);
});

test('normalizeSnapshot clamps boundary metrics and safely defaults missing optional data', () => {
  const result = normalizeSnapshot({ ...valid(), total: -1, cacheHitRate: 9, sessions: -4, platforms: [{ activeSessionList: [], total: -2 }] });
  assert.equal(result.total, 0);
  assert.equal(result.cacheHitRate, 1);
  assert.equal(result.sessions, 0);
  assert.equal(result.platforms[0].total, 0);
  assert.equal(result.hardware, null);
});
