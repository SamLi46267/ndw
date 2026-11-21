import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readWarningData, validateSnapshot } from './publish-snapshot.mjs';

test('reads a warning ledger larger than the default Git subprocess buffer', t => {
  const root = mkdtempSync(path.join(tmpdir(), 'ndw-warning-ledger-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (args, input) => execFileSync('git', args, { cwd: root, encoding: 'utf8', input }).trim();
  git(['init', '--quiet', '--bare']);
  const ledger = { entries: {}, alertHistory: { sample: '警'.repeat(400000) } };
  const blob = git(['hash-object', '-w', '--stdin'], JSON.stringify(ledger));
  const tree = git(['mktree'], '100644 blob ' + blob + '\tstate.json\n');
  assert.deepEqual(readWarningData(root, tree, 'state.json'), ledger);
});

test('publishing preserves warning payloads and original timestamps', () => {
  const data = { version: 1, generatedAt: 1000, entries: {
    '/alerts/v1/101924.json': { checkedAt: 900, data: [{ AlertID: 'test', Level: 'red' }] }
  } };
  assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(data))), data);
  assert.throws(() => validateSnapshot({ version: 1, generatedAt: 1000, entries: { '/bad': {} } }));
  assert.throws(() => validateSnapshot({ version: 1, entries: {} }));
});
