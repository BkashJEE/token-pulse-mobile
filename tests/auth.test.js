import test from 'node:test';
import assert from 'node:assert/strict';
import { bearer, safeEqual } from '../lib/auth.js';

test('safeEqual accepts only equal non-empty bounded strings', () => {
  assert.equal(safeEqual('same', 'same'), true);
  assert.equal(safeEqual('same', 'different'), false);
  assert.equal(safeEqual('', ''), false);
  assert.equal(safeEqual(null, 'x'), false);
  assert.equal(safeEqual('x'.repeat(4097), 'x'.repeat(4097)), false);
});

test('bearer accepts case-insensitive scheme and rejects ambiguous or injected headers', () => {
  const request = header => new Request('https://example.test', { headers: { authorization: header } });
  assert.equal(bearer(request('bearer token')), 'token');
  assert.equal(bearer(request('Bearer\tsecret')), 'secret');
  assert.equal(bearer(request('Basic token')), '');
  assert.equal(bearer(request('Bearer')), '');
  assert.equal(bearer(request('Bearer   ')), '');
});
