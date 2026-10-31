import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import type { DiscoveredPackage } from './package-discovery.js';
import {
  schemaErrorLocation,
  createSchemaLoader,
  type SchemaLoader,
} from './schema-loader.js';
import type { ValidationError, ValidationResult } from './diagnostics.js';

const TASK_ID = /^[a-z0-9][a-z0-9-]*$/;
const TARGET_SOURCES = new Set([
  'owner-project-repositories',
  'vault-registry',
  'project-registry',
]);

type JsonObject = Record<string, any>;

function readJson(path: string): { value?: any; error?: string } {
  try {
    return { value: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function walkJson(root: string, current = root, result: string[] = []): string[] {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) walkJson(root, path, result);
    else if (entry.isFile() && entry.name.endsWith('.json')) result.push(relative(root, path));
  }
  return result;
}

function parseFrontmatter(content: string): JsonObject {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const result: JsonObject = {};
  let key: string | undefined;
  let list: string[] | undefined;
  const flush = () => {
    if (key && list) result[key] = list;
    list = undefined;
  };
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item) {
      list ??= [];
      list.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!scalar) continue;
    flush();
    key = scalar[1];
    const value = scalar[2].trim().replace(/^['"]|['"]$/g, '');
    if (value) result[key] = value;
    else list = undefined;
  }
  flush();
  return result;
}

function errorFor(pkg: DiscoveredPackage, file: string, field: string, message: string): ValidationError {
  return {
    packageId: pkg.rel,
    file: file ? `${pkg.rel}/${file}` : pkg.rel,
    field,
    message,
  };
}

function schemaErrors(
  pkg: DiscoveredPackage,
  file: string,
  schema: string,
  loader: SchemaLoader,
  value: unknown,
): ValidationError[] {
  return loader.validate(schema, value).map((error) => {
    const detail = error.params?.allowedValues
      ? ` (${(error.params.allowedValues as unknown[]).join(', ')})`
      : '';
    return errorFor(
      pkg,
      file,
      `schema:${schema}${schemaErrorLocation(error)}`,
      `${error.message ?? 'schema validation failed'}${detail}`,
    );
  });
}

function validateJsonDocuments(pkg: DiscoveredPackage, loader: SchemaLoader): ValidationError[] {
  const errors: ValidationError[] = [];
  let files: string[] = [];
  try {
    files = walkJson(pkg.dir);
  } catch (error) {
    errors.push(errorFor(pkg, '', 'filesystem', `unable to read package: ${String(error)}`));
    return errors;
  }
  for (const file of files) {
    const parsed = readJson(resolve(pkg.dir, file));
    if (parsed.error) {
      errors.push(errorFor(pkg, file, 'parse', `invalid JSON: ${parsed.error}`));
      continue;
    }
    const document = parsed.value;
    if (!document || typeof document !== 'object') continue;
    const schemaReference = typeof document.$schema === 'string' ? document.$schema : undefined;
    const knownSchema = file === 'manifest.json'
      ? 'manifest.schema.json'
      : file === 'frontend/panel.json'
        ? 'panel.schema.json'
        : file === 'frontend/commands.json'
          ? 'commands.schema.json'
          : file === 'backend/task-preset.json'
            ? 'task-preset.schema.json'
            : file === 'backend/prompts.json'
              ? 'prompt-package.schema.json'
              : file.startsWith('locales/') ? 'locales.schema.json' : undefined;
    const schema = schemaReference ? loader.resolveReference(schemaReference) : knownSchema;
    if (!schema) {
      if (schemaReference) {
        errors.push(errorFor(pkg, file, `$schema(${schemaReference})`, 'unresolved schema reference (only package schemas shipped with @hagicode/hagitask are available)'));
      }
      continue;
    }
    if (!loader.hasSchema(schema)) {
      errors.push(errorFor(pkg, file, schemaReference ? `$schema(${schemaReference})` : '$schema', `schema '${schema}' is not available in the published schema set`));
      continue;
    }
    errors.push(...schemaErrors(pkg, file, schema, loader, document));
  }
  return errors;
}

function validatePath(
  pkg: DiscoveredPackage,
  file: string,
  field: string,
  reference: unknown,
  directory = false,
): { path?: string; errors: ValidationError[] } {
  if (typeof reference !== 'string' || reference.length === 0) return { errors: [] };
  const path = resolve(pkg.dir, reference);
  if (path !== pkg.dir && !path.startsWith(pkg.dir + sep)) {
    return { errors: [errorFor(pkg, 'manifest.json', field, `path escapes package directory: ${reference}`)] };
  }
  if (!existsSync(path)) {
    return { errors: [errorFor(pkg, 'manifest.json', field, `missing declared ${directory ? 'directory' : 'file'}: ${reference}`)] };
  }
  if (directory && !statSync(path).isDirectory()) {
    return { errors: [errorFor(pkg, 'manifest.json', field, `must be a directory: ${reference}`)] };
  }
  if (!directory && !statSync(path).isFile()) {
    return { errors: [errorFor(pkg, 'manifest.json', field, `must be a file: ${reference}`)] };
  }
  return { path, errors: [] };
}

function validateCrossFile(
  pkg: DiscoveredPackage,
  manifest: JsonObject,
  loader: SchemaLoader,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const add = (file: string, field: string, message: string) => errors.push(errorFor(pkg, file, field, message));
  const localization = manifest.localization ?? {};
  const supported = Array.isArray(localization.supportedLocales) ? localization.supportedLocales : [];
  const bundles = localization.bundles ?? {};
  const defaultLocale = localization.defaultLocale;

  if (defaultLocale && !supported.includes(defaultLocale)) {
    add('manifest.json', 'localization.defaultLocale', `default locale '${defaultLocale}' not in supportedLocales`);
  }
  for (const locale of supported) {
    if (!(locale in bundles)) {
      add('manifest.json', 'localization.bundles', `missing bundle for supported locale '${locale}'`);
    }
    const page = `store-page/index.${locale}.md`;
    if (!existsSync(resolve(pkg.dir, page))) {
      add(page, 'store-page', `missing store page for supported locale '${locale}'`);
    }
  }

  const storePageRef = manifest.site?.storePage;
  const storePage = typeof storePageRef === 'string' ? resolve(pkg.dir, storePageRef) : resolve(pkg.dir, 'store-page');
  if (existsSync(storePage) && statSync(storePage).isDirectory()) {
    for (const file of readdirSync(storePage)) {
      const match = file.match(/^index\.([A-Za-z-]+)\.md$/);
      if (!match) continue;
      const locale = match[1];
      const relativeFile = relative(pkg.dir, resolve(storePage, file)).replaceAll(sep, '/');
      const frontmatter = parseFrontmatter(readFileSync(resolve(storePage, file), 'utf8'));
      // Older shipped presets use Markdown without frontmatter. Keep those
      // packages valid while validating frontmatter whenever it is authored.
      const hasFrontmatter = /^---\r?\n/.test(readFileSync(resolve(storePage, file), 'utf8'));
      if (hasFrontmatter && loader.hasSchema('store-page-frontmatter.schema.json')) {
        errors.push(...schemaErrors(pkg, relativeFile, 'store-page-frontmatter.schema.json', loader, frontmatter));
      }
      if (frontmatter.slug !== undefined && frontmatter.slug !== pkg.dirName) {
        add(relativeFile, 'slug', `must equal taskId '${pkg.dirName}' (got '${frontmatter.slug}')`);
      }
      if (frontmatter.locale !== undefined && frontmatter.locale !== locale) {
        add(relativeFile, 'locale', `must equal file locale '${locale}' (got '${frontmatter.locale}')`);
      }
      if (!supported.includes(locale)) {
        add(relativeFile, 'locale', `store page locale '${locale}' not in manifest supportedLocales`);
      }
    }
  }

  const promptsRef = manifest.backend?.prompts;
  if (typeof promptsRef !== 'string') return errors;
  const promptsPath = resolve(pkg.dir, promptsRef);
  const prompts = readJson(promptsPath);
  if (prompts.error || !prompts.value || typeof prompts.value !== 'object') return errors;
  const value = prompts.value as JsonObject;
  const promptFile = relative(pkg.dir, promptsPath).replaceAll(sep, '/');
  const references = new Set<string>();
  for (const reference of Object.values(value.partials ?? {})) {
    if (typeof reference === 'string') references.add(reference);
  }
  for (const prompt of Object.values(value.locales ?? {})) {
    if (!prompt || typeof prompt !== 'object') continue;
    const localePrompt = prompt as JsonObject;
    for (const field of ['systemTemplate', 'developerTemplate', 'userTemplate', 'outputSchema']) {
      if (typeof localePrompt[field] === 'string') references.add(localePrompt[field]);
    }
  }
  for (const entry of value.variants?.entries ?? []) {
    for (const field of ['systemTemplate', 'userTemplate']) {
      if (typeof entry?.[field] === 'string') references.add(entry[field]);
    }
  }
  for (const field of ['systemTemplate', 'userTemplate']) {
    if (typeof value.variants?.fallback?.[field] === 'string') references.add(value.variants.fallback[field]);
  }
  for (const [command, locales] of Object.entries(value.commandSystemPrompts ?? {})) {
    if (!command.trim() || !locales || typeof locales !== 'object' || Array.isArray(locales)) {
      add(promptFile, `commandSystemPrompts.${command}`, 'command-specific prompt mapping must be a locale object');
      continue;
    }
    for (const [locale, reference] of Object.entries(locales as JsonObject)) {
      if (!locale.trim() || typeof reference !== 'string' || !reference.trim()) {
        add(promptFile, `commandSystemPrompts.${command}.${locale}`, 'command-specific prompt template must be a non-empty path');
      } else {
        references.add(reference);
        if (!supported.includes(locale)) {
          add(promptFile, `commandSystemPrompts.${command}.${locale}`, `prompt locale '${locale}' not declared in manifest supportedLocales`);
        }
      }
    }
  }
  const promptDir = dirname(promptsPath);
  for (const reference of references) {
    const target = resolve(promptDir, reference);
    if (target !== pkg.dir && !target.startsWith(pkg.dir + sep) || !existsSync(target)) {
      add(promptFile, `template:${reference}`, 'prompt template file not found within package');
    }
  }
  for (const locale of Array.isArray(value.supportedLocales) ? value.supportedLocales : []) {
    if (!supported.includes(locale)) add(promptFile, 'supportedLocales', `prompt locale '${locale}' not declared in manifest.supportedLocales`);
  }
  for (const locale of Object.keys(value.locales ?? {})) {
    if (!supported.includes(locale)) {
      add(promptFile, `locales.${locale}`, `prompt locale '${locale}' not declared in manifest.supportedLocales`);
    }
  }
  return errors;
}

function validateContract(pkg: DiscoveredPackage, manifest: JsonObject, loader: SchemaLoader): ValidationError[] {
  const errors: ValidationError[] = [];
  const add = (file: string, field: string, message: string) => errors.push(errorFor(pkg, file, field, message));
  const declarations: Array<[string, unknown, boolean]> = [
    ['ui.panel', manifest.ui?.panel, false],
    ['ui.commands', manifest.ui?.commands, false],
    ['site.storePage', manifest.site?.storePage, true],
    ['backend.taskPreset', manifest.backend?.taskPreset, false],
    ['backend.prompts', manifest.backend?.prompts, false],
  ];
  for (const [field, reference, directory] of declarations) errors.push(...validatePath(pkg, 'manifest.json', field, reference, directory).errors);
  for (const [locale, reference] of Object.entries(manifest.localization?.bundles ?? {})) {
    errors.push(...validatePath(pkg, 'manifest.json', `localization.bundles.${locale}`, reference).errors);
  }

  const panelRef = manifest.ui?.panel;
  if (typeof panelRef === 'string' && panelRef.length > 0) {
    const panelPath = resolve(pkg.dir, panelRef);
    const panel = panelPath.startsWith(pkg.dir + sep) ? readJson(panelPath) : {};
    if (!panel.error && panel.value && typeof panel.value === 'object') {
      const sections: any[] = Array.isArray(panel.value.sections) ? panel.value.sections : [];
      const hasSelector = sections.some((section) =>
        Array.isArray(section?.fields) && section.fields.some((field: any) => field?.renderer === 'project-picker'));
      if (!hasSelector) {
        add('frontend/panel.json', 'sections', 'a project selector (renderer "project-picker") is required');
      }
    }
  }

  const taskPresetRef = manifest.backend?.taskPreset;
  if (typeof taskPresetRef !== 'string') return errors;
  const taskPresetPath = resolve(pkg.dir, taskPresetRef);
  const parsed = readJson(taskPresetPath);
  if (parsed.error || !parsed.value || typeof parsed.value !== 'object') return errors;
  const taskPreset = parsed.value as JsonObject;
  for (const [kind, bucket] of Object.entries(taskPreset.targets ?? {})) {
    const targetBucket = bucket as JsonObject;
    if (!targetBucket || targetBucket.enabled !== true || !Array.isArray(targetBucket.selections)) continue;
    for (const selection of targetBucket.selections as any[]) {
      const source = selection?.scope?.source;
      if (source !== undefined && !TARGET_SOURCES.has(source)) {
        add(taskPresetRef, `targets.${kind}.selections[${selection?.id ?? '<unknown>'}].scope.source`, `selection '${selection?.id ?? '<unknown>'}' uses unsupported scope source ${JSON.stringify(source)}`);
      }
    }
  }
  const execution = taskPreset.execution;
  if (execution !== undefined) {
    if (!execution || typeof execution !== 'object' || !/^1\./.test(execution.schemaVersion ?? '') || !['declarative', 'extension'].includes(execution.strategy)) {
      add(taskPresetRef, 'execution', 'must declare schemaVersion 1.x and strategy declarative or extension');
    } else if (execution.strategy === 'extension' && typeof execution.extensionPoint !== 'string') {
      add(taskPresetRef, 'execution.extensionPoint', 'is required for extension strategy');
    } else if (execution.strategy === 'declarative' && execution.extensionPoint !== undefined) {
      add(taskPresetRef, 'execution.extensionPoint', 'must be omitted for declarative strategy');
    }
  }
  const inputs = Array.isArray(taskPreset.inputBindings) ? taskPreset.inputBindings : [];
  const seenAliases = new Set<string>();
  for (const binding of inputs) {
    const aliases = Array.isArray(binding?.aliases) ? binding.aliases : [];
    if (aliases.includes(binding?.input)) add(taskPresetRef, `inputBindings.${binding?.input}.aliases`, 'must not contain its canonical input name');
    for (const alias of aliases) {
      if (seenAliases.has(alias)) add(taskPresetRef, `inputBindings.${binding?.input}.aliases`, `alias '${alias}' is declared more than once`);
      seenAliases.add(alias);
    }
    if (binding?.transform === 'url-list' && !['url-list', 'multiple'].includes(binding?.valueType)) {
      add(taskPresetRef, `inputBindings.${binding?.input}.valueType`, 'url-list transform requires url-list valueType');
    }
  }
  return errors;
}

export function validatePackage(
  pkg: DiscoveredPackage,
  targetRoot: string,
  packageRoot: string,
): ValidationError[] {
  const loader = createSchemaLoader(targetRoot, packageRoot);
  const errors: ValidationError[] = [];
  const manifestFile = resolve(pkg.dir, 'manifest.json');
  const manifestResult = readJson(manifestFile);
  if (manifestResult.error) {
    errors.push(errorFor(pkg, 'manifest.json', 'parse', `invalid JSON: ${manifestResult.error}`));
    return errors;
  }
  const manifest = manifestResult.value as JsonObject;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push(errorFor(pkg, 'manifest.json', 'root', 'expected a JSON object'));
    return errors;
  }
  if (typeof manifest.taskPresetId !== 'string' || !TASK_ID.test(manifest.taskPresetId)) {
    errors.push(errorFor(pkg, 'manifest.json', 'taskPresetId', `must match ^[a-z0-9][a-z0-9-]*$ (got ${JSON.stringify(manifest.taskPresetId)})`));
  } else if (manifest.taskPresetId !== pkg.dirName) {
    errors.push(errorFor(pkg, 'manifest.json', 'taskPresetId', `must equal directory name '${pkg.dirName}' (got '${manifest.taskPresetId}')`));
  }
  errors.push(...validateJsonDocuments(pkg, loader));
  errors.push(...validateContract(pkg, manifest, loader));
  errors.push(...validateCrossFile(pkg, manifest, loader));
  return errors;
}

export function validateDiscoveredPackages(
  packages: DiscoveredPackage[],
  targetRoot: string,
  packageRoot: string,
): ValidationResult {
  const errors: ValidationError[] = [];
  const ids = new Map<string, string[]>();
  for (const pkg of packages) {
    const result = readJson(resolve(pkg.dir, 'manifest.json'));
    if (!result.error && typeof result.value?.taskPresetId === 'string') {
      const list = ids.get(result.value.taskPresetId) ?? [];
      list.push(pkg.rel);
      ids.set(result.value.taskPresetId, list);
    }
  }
  for (const pkg of packages) errors.push(...validatePackage(pkg, targetRoot, packageRoot));
  for (const [id, dirs] of ids) {
    if (dirs.length < 2) continue;
    for (const dir of dirs) {
      errors.push({
        packageId: dir,
        file: `${dir}/manifest.json`,
        field: 'taskPresetId',
        message: `duplicate canonical id '${id}' also used by ${dirs.filter((other) => other !== dir).join(', ')}`,
      });
    }
  }
  return {
    packages: packages.map((pkg) => pkg.rel).sort(),
    errors,
    valid: errors.length === 0,
  };
}
