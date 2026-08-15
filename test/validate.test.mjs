import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validatePackages } from '../dist/index.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('validates both shipped presets', () => {
  const result = validatePackages(root);
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  assert.deepEqual(result.packages, ['presets/normal-session', 'presets/research-investigation']);
});

test('reports unsupported paths and JSON diagnostics', () => {
  const missing = validatePackages(join(root, 'does-not-exist'));
  assert.equal(missing.valid, false);
  assert.match(missing.errors[0].message, /does not exist/);

  const output = spawnSync(process.execPath, [join(root, 'dist/cli.js'), 'validate', join(root, 'does-not-exist'), '--json'], {
    encoding: 'utf8',
  });
  assert.equal(output.status, 1);
  const json = JSON.parse(output.stdout);
  assert.equal(json.valid, false);
  assert.equal(json.errors[0].field, 'path');
});

test('discovers and validates a single package directory', () => {
  const fixture = mkdtempSync(join(root, '.test-fixture-'));
  try {
    mkdirSync(join(fixture, 'presets', 'empty'), { recursive: true });
    writeFileSync(join(fixture, 'presets', 'empty', 'manifest.json'), '{ invalid');
    const result = validatePackages(join(fixture, 'presets', 'empty'));
    assert.equal(result.valid, false);
    assert.equal(result.errors[0].field, 'parse');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
