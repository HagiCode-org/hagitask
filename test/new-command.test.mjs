import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runNewCommand } from '../dist/commands/new-command.js';
import { validatePackages } from '../dist/index.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('creates a scaffold in the default and explicit target directories', () => {
  const fixture = mkdtempSync(join(root, '.new-command-'));
  try {
    const defaultResult = runNewCommand('sample-task', { repository: ['repo-a', 'repo-b'] }, fixture);
    assert.equal(defaultResult.code, 0);
    assert.equal(defaultResult.packagePath, join(fixture, 'sample-task'));
    const explicit = runNewCommand('explicit-task', { target: join(fixture, 'explicit-task') }, fixture);
    assert.equal(explicit.code, 0);
    assert.equal(existsSync(join(fixture, 'explicit-task', 'manifest.json')), true);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('rejects invalid names and non-empty targets without changing them', () => {
  const fixture = mkdtempSync(join(root, '.new-command-'));
  const occupied = join(fixture, 'occupied');
  mkdirSync(occupied);
  writeFileSync(join(occupied, 'keep.txt'), 'keep');
  try {
    assert.equal(runNewCommand('Not-valid', {}, fixture).code, 1);
    const result = runNewCommand('sample-task', { target: occupied }, fixture);
    assert.equal(result.code, 1);
    assert.deepEqual(readdirSync(occupied), ['keep.txt']);
    assert.equal(readFileSync(join(occupied, 'keep.txt'), 'utf8'), 'keep');
    const fileTarget = join(fixture, 'not-a-directory');
    writeFileSync(fileTarget, 'keep');
    assert.equal(runNewCommand('file-target', { target: fileTarget }, fixture).code, 1);
    assert.equal(readFileSync(fileTarget, 'utf8'), 'keep');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('new output validates as a package and contains command extensions', () => {
  const fixture = mkdtempSync(join(root, '.new-command-'));
  try {
    const output = spawnSync(process.execPath, [join(root, 'dist/cli.js'), 'new', 'generated-task', '--target', join(fixture, 'generated-task'), '--repository', 'repo-a', 'repo-b'], {
      encoding: 'utf8',
    });
    assert.equal(output.status, 0, output.stderr);
    const packagePath = join(fixture, 'generated-task');
    const validation = validatePackages(packagePath);
    assert.equal(validation.valid, true, validation.errors.map((error) => error.message).join('\n'));
    const commands = JSON.parse(readFileSync(join(packagePath, 'frontend/commands.json'), 'utf8'));
    assert.deepEqual(commands.commands.map((command) => command.id), ['what-is-this', 'what-is-next']);
    assert.equal(JSON.parse(readFileSync(join(packagePath, 'frontend/panel.json'), 'utf8')).sections[0].fields[0].output, 'targetRepositories');
    assert.equal(existsSync(join(packagePath, 'backend/templates/en-US/commands/what-is-this.md')), true);
    assert.equal(existsSync(join(packagePath, 'backend/templates/zh-CN/commands/what-is-next.md')), true);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
