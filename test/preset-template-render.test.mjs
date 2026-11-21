import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const presets = resolve(fileURLToPath(new URL('../presets', import.meta.url)));
const PRESET_IDS = ['normal-session', 'research-investigation'];
const LOCALES = ['en-US', 'zh-CN'];

const repo = (path, displayName, accessType) => ({ path, name: path, displayName, accessType });

// Same shape the backend exposes to the template model (targetProjects entries).
const fixtures = {
  wholeProject: {
    projectId: 'project-alpha',
    name: 'Alpha',
    physicalPath: '/repos/alpha',
    accessType: 'write',
    isWholeProject: true,
    isSelectAll: false,
    repositories: [],
    repositoryScopeFallback: false,
  },
  explicitList: {
    projectId: 'project-beta',
    name: 'Beta',
    physicalPath: '/repos/beta',
    accessType: 'write',
    isWholeProject: false,
    isSelectAll: false,
    repositories: [
      repo('api', 'API', 'write'),
      repo('web', 'Web', 'read'),
      repo('docs', 'Docs', 'read'),
    ],
    repositoryScopeFallback: false,
  },
  selectAll: {
    projectId: 'project-gamma',
    name: 'Gamma',
    physicalPath: '/repos/gamma',
    accessType: 'read',
    isWholeProject: false,
    isSelectAll: true,
    selectAllAccess: 'read',
    repositories: [repo('svc', 'Service', 'read'), repo('lib', 'Library', 'read')],
    repositoryScopeFallback: false,
  },
  selectAllFallback: {
    projectId: 'project-delta',
    name: 'Delta',
    physicalPath: '/repos/delta',
    accessType: 'write',
    isWholeProject: false,
    isSelectAll: true,
    selectAllAccess: 'write',
    repositories: [repo('core', 'Core', 'write')],
    repositoryScopeFallback: true,
  },
};

const compiled = new Map();
function render(presetId, locale, targetProjects) {
  const key = `${presetId}/${locale}`;
  if (!compiled.has(key)) {
    const source = readFileSync(resolve(presets, presetId, 'backend/templates', locale, 'user.hbs'), 'utf8');
    compiled.set(key, Handlebars.compile(source, { noEscape: true }));
  }
  return compiled.get(key)({
    projectPath: '/vault',
    projectId: 'vault-1',
    repositoryPath: '/repos/beta',
    targetType: 'vault',
    outputVaultName: 'Vault',
    researchDirection: 'direction',
    normalSessionInput: 'input',
    targetProjects,
  });
}

// The project section starts at the "Project references" heading and ends at the next level-2 heading.
function projectSection(output) {
  const start = output.search(/^### (Project references|项目引用)$/m);
  assert.notEqual(start, -1, 'project references heading is missing');
  const end = output.indexOf('\n## ', start);
  return output.slice(start, end < 0 ? undefined : end);
}

// Backticked tokens carry the names, paths and levels; labels differ by locale but tokens must not.
const tokens = (text) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

const ALL_PROJECTS = Object.values(fixtures);

for (const presetId of PRESET_IDS) {
  for (const locale of LOCALES) {
    test(`${presetId} ${locale} renders each project once with its repository levels`, () => {
      const section = projectSection(render(presetId, locale, ALL_PROJECTS));
      for (const project of ALL_PROJECTS) {
        assert.equal(section.split(`\`${project.name}\``).length - 1, 1, `${project.name} must appear once`);
        assert.ok(section.includes(project.physicalPath), `${project.name} path missing`);
        for (const item of project.repositories) {
          assert.ok(section.includes(`\`${item.path}\``), `${item.path} missing`);
          assert.ok(section.includes(`\`${item.displayName}\``), `${item.displayName} missing`);
        }
      }
      // Explicit list: one line per repository with its own level, in saved order.
      const beta = section.slice(section.indexOf('`Beta`'), section.indexOf('`Gamma`'));
      assert.deepEqual(
        tokens(beta).filter((token) => ['write', 'read'].includes(token)),
        ['write', 'write', 'read', 'read'],
        'project level then API write, Web read, Docs read',
      );
    });

    test(`${presetId} ${locale} states whole-project and select-all coverage`, () => {
      const section = projectSection(render(presetId, locale, [fixtures.wholeProject, fixtures.selectAll]));
      const whole = locale === 'en-US' ? /Whole project: covers all repositories/ : /整个项目：涵盖该项目的全部仓库/;
      assert.match(section, whole);
      const selectAll = locale === 'en-US' ? /Covers all repositories of this project at access `read`, resolved for this run/ : /涵盖该项目的全部仓库，访问模式为 `read`|涵盖该项目的全部仓库，权限为 `read`/;
      assert.match(section, selectAll);
      assert.ok(section.includes('`Service`') && section.includes('`Library`'), 'resolved select-all repositories listed');
      assert.doesNotMatch(section, /saved snapshot|保存时的快照/, 'no fallback note without fallback');
    });

    test(`${presetId} ${locale} marks a select-all snapshot fallback`, () => {
      const section = projectSection(render(presetId, locale, [fixtures.selectAllFallback]));
      assert.match(section, locale === 'en-US' ? /saved snapshot/ : /保存时的快照/);
      assert.ok(section.includes('`Core`'));
    });

    test(`${presetId} ${locale} carries the write-only sentence without enforcement wording`, () => {
      const section = projectSection(render(presetId, locale, ALL_PROJECTS));
      const sentence = locale === 'en-US' ? 'Modify only `write` repositories' : '仅修改标记为 `write` 的仓库';
      assert.ok(section.includes(sentence), 'write-only sentence present');
      assert.doesNotMatch(section, /sandbox|isolat|enforc|沙箱|隔离|强制/i);
    });
  }

  test(`${presetId} renders the same projects, repositories and levels in both locales`, () => {
    const en = tokens(projectSection(render(presetId, 'en-US', ALL_PROJECTS)));
    const zh = tokens(projectSection(render(presetId, 'zh-CN', ALL_PROJECTS)));
    assert.deepEqual(zh, en);
  });
}
