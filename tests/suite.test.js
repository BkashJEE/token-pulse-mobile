import test from 'node:test';
import assert from 'node:assert/strict';

import { suiteViews, resolveSuiteView } from '../lib/suite-navigation.js';
import { promptTemplates, filterPrompts, writePromptToClipboard } from '../lib/prompt-gallery.js';

test('Token Pulse is the default suite view with Prompt Gallery and Growth Tracker as sibling views', () => {
  assert.deepEqual(suiteViews.map(view => [view.id, view.href]), [
    ['pulse', '/'],
    ['prompts', '/prompts'],
    ['growth', '/growth'],
  ]);
  assert.equal(suiteViews[0].label, 'Token Pulse');
  assert.equal(resolveSuiteView('/'), 'pulse');
  assert.equal(resolveSuiteView('/prompts'), 'prompts');
  assert.equal(resolveSuiteView('/growth'), 'growth');
  assert.equal(resolveSuiteView('/prompts/library'), 'prompts');
  assert.equal(resolveSuiteView('/growth/history'), 'growth');
  assert.equal(resolveSuiteView('/operator'), null);
  assert.equal(resolveSuiteView('/unknown'), null);
});

test('Prompt Gallery ships useful templates with complete metadata and unique ids', () => {
  assert.ok(promptTemplates.length >= 10);
  assert.equal(new Set(promptTemplates.map(prompt => prompt.id)).size, promptTemplates.length);
  for (const prompt of promptTemplates) {
    assert.ok(prompt.title.length > 3);
    assert.ok(prompt.description.length > 12);
    assert.ok(prompt.category.length > 2);
    assert.ok(prompt.prompt.length > 80);
  }
});

test('Prompt Gallery search and category filters are case-insensitive and composable', () => {
  assert.ok(filterPrompts(promptTemplates, { query: 'COST' }).some(prompt => /cost/i.test(`${prompt.title} ${prompt.description} ${prompt.prompt}`)));
  const growth = filterPrompts(promptTemplates, { category: 'Growth' });
  assert.ok(growth.length > 0);
  assert.ok(growth.every(prompt => prompt.category === 'Growth'));
  assert.deepEqual(filterPrompts(promptTemplates, { query: 'no-template-can-match-this' }), []);
  assert.ok(filterPrompts(promptTemplates, { category: 'All' }).length === promptTemplates.length);
  const combined = filterPrompts(promptTemplates, { query: 'content', category: 'Growth' });
  assert.ok(combined.length > 0);
  assert.ok(combined.every(prompt => prompt.category === 'Growth' && /content/i.test(`${prompt.title} ${prompt.description} ${prompt.prompt}`)));
});

test('Prompt Gallery clipboard helper reports unavailable and rejected writes', async () => {
  const writes = [];
  await writePromptToClipboard({ writeText: async text => writes.push(text) }, 'Proof-first prompt');
  assert.deepEqual(writes, ['Proof-first prompt']);
  await assert.rejects(() => writePromptToClipboard(undefined, 'Prompt'), /Clipboard unavailable/);
  await assert.rejects(() => writePromptToClipboard({ writeText: async () => { throw new Error('blocked'); } }, 'Prompt'), /blocked/);
});
