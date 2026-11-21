import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

const selectorMessage = /a project selector \(renderer "project-picker"\) is required/;

test('reports a shipped preset whose panel has no project selector, naming the package, panel and field', () => {
  const fixture = mkdtempSync(join(root, '.test-fixture-'));
  try {
    const packagePath = join(fixture, 'presets', 'normal-session');
    cpSync(join(root, 'presets', 'normal-session'), packagePath, { recursive: true });
    const panelPath = join(packagePath, 'frontend', 'panel.json');
    const panel = JSON.parse(readFileSync(panelPath, 'utf8'));
    panel.sections[0].fields = panel.sections[0].fields.filter((field) => field.renderer !== 'project-picker');
    writeFileSync(panelPath, JSON.stringify(panel));

    const result = validatePackages(packagePath);
    assert.equal(result.valid, false);
    const selectorErrors = result.errors.filter((error) => selectorMessage.test(error.message));
    assert.equal(selectorErrors.length, 1, result.errors.map((error) => error.message).join('\n'));
    assert.match(selectorErrors[0].packageId, /normal-session/);
    assert.match(selectorErrors[0].file, /normal-session\/frontend\/panel\.json$/);
    assert.equal(selectorErrors[0].field, 'sections');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('an unchanged shipped preset reports no project selector error', () => {
  const result = validatePackages(join(root, 'presets', 'normal-session'));
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  assert.equal(result.errors.some((error) => selectorMessage.test(error.message)), false);
});

test('a package without a panel file reports no project selector error', () => {
  const fixture = mkdtempSync(join(root, '.test-fixture-'));
  try {
    const packagePath = join(fixture, 'presets', 'normal-session');
    cpSync(join(root, 'presets', 'normal-session'), packagePath, { recursive: true });
    rmSync(join(packagePath, 'frontend', 'panel.json'));
    const manifestPath = join(packagePath, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    delete manifest.ui.panel;
    writeFileSync(manifestPath, JSON.stringify(manifest));

    const result = validatePackages(packagePath);
    assert.equal(result.errors.some((error) => selectorMessage.test(error.message)), false);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

function withFixturePackage(mutate) {
  const fixture = mkdtempSync(join(root, '.test-fixture-'));
  const packagePath = join(fixture, 'presets', 'normal-session');
  cpSync(join(root, 'presets', 'normal-session'), packagePath, { recursive: true });
  const taskPresetPath = join(packagePath, 'backend', 'task-preset.json');
  const taskPreset = JSON.parse(readFileSync(taskPresetPath, 'utf8'));
  mutate(taskPreset);
  writeFileSync(taskPresetPath, JSON.stringify(taskPreset));
  return { fixture, packagePath };
}

test('a package with no targets section validates', () => {
  const { fixture, packagePath } = withFixturePackage((taskPreset) => {
    delete taskPreset.targets;
  });
  try {
    const result = validatePackages(packagePath);
    assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('a package that declares only the repositories bucket validates', () => {
  const { fixture, packagePath } = withFixturePackage((taskPreset) => {
    taskPreset.targets = { repositories: taskPreset.targets.repositories };
  });
  try {
    const result = validatePackages(packagePath);
    assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('a legacy package with enabled false buckets validates unchanged', () => {
  const { fixture, packagePath } = withFixturePackage((taskPreset) => {
    taskPreset.targets.vaults = { enabled: false };
    taskPreset.targets.projects = { enabled: false };
  });
  try {
    const result = validatePackages(packagePath);
    assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('a bucket that declares selections without enabled is still rejected', () => {
  const { fixture, packagePath } = withFixturePackage((taskPreset) => {
    taskPreset.targets.vaults = { selections: taskPreset.targets.repositories.selections };
  });
  try {
    const result = validatePackages(packagePath);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => /enabled/.test(error.message)), result.errors.map((error) => error.message).join('\n'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('an unsupported scope source is reported with its package, file and selection id', () => {
  let selectionId;
  const { fixture, packagePath } = withFixturePackage((taskPreset) => {
    selectionId = taskPreset.targets.repositories.selections[0].id;
    taskPreset.targets.repositories.selections[0].scope = { source: 'remote-registry' };
  });
  try {
    const result = validatePackages(packagePath);
    assert.equal(result.valid, false);
    const scopeError = result.errors.find((error) => /unsupported scope source/.test(error.message));
    assert.ok(scopeError, result.errors.map((error) => error.message).join('\n'));
    assert.match(scopeError.packageId, /normal-session/);
    assert.match(scopeError.file, /normal-session\/(\.\/)?backend\/task-preset\.json$/);
    assert.ok(scopeError.message.includes(`'${selectionId}'`), scopeError.message);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
