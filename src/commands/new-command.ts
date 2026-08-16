import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createNewPackageFiles } from '../templates/new-package.js';

const PACKAGE_NAME = /^[a-z0-9][a-z0-9-]*$/;
const REPOSITORY_ID = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export interface NewCommandOptions {
  target?: string;
  destination?: string;
  output?: string;
  repositories?: string[];
  repository?: string[];
}

export interface NewCommandResult {
  code: number;
  packagePath?: string;
  files?: string[];
  error?: string;
}

function optionTarget(options: NewCommandOptions): string | undefined {
  return options.target ?? options.destination ?? options.output;
}

function repositoriesFromOptions(options: NewCommandOptions): string[] {
  const values = options.repositories ?? options.repository ?? [];
  return values.flatMap((value) => value.split(',').map((item) => item.trim())).filter(Boolean);
}

function validateInput(packageName: string | undefined, options: NewCommandOptions): string | undefined {
  if (!packageName || !PACKAGE_NAME.test(packageName)) {
    return 'package name must match ^[a-z0-9][a-z0-9-]*$';
  }
  const repositories = repositoriesFromOptions(options);
  if (repositories.some((repository) => !REPOSITORY_ID.test(repository) || repository.includes('..'))) {
    return 'repository identifiers must be non-empty and contain only letters, numbers, ".", "_", "-", or "/"';
  }
  const target = optionTarget(options);
  if (target !== undefined && (!target.trim() || target.includes('\0'))) {
    return 'target path must be a non-empty valid path';
  }
  return undefined;
}

export function runNewCommand(
  packageName: string | undefined,
  options: NewCommandOptions = {},
  cwd = process.cwd(),
): NewCommandResult {
  const inputError = validateInput(packageName, options);
  if (inputError) return { code: 1, error: inputError };

  const name = packageName as string;
  const target = resolve(cwd, optionTarget(options) ?? name);
  if (optionTarget(options) !== undefined && basename(target) !== name) {
    return { code: 1, error: `target directory name must equal package name '${name}'` };
  }
  if (existsSync(target)) {
    if (!statSync(target).isDirectory()) return { code: 1, error: `target path is not a directory: ${target}` };
    if (readdirSync(target).length > 0) return { code: 1, error: `target directory is not empty: ${target}` };
  }

  const files = createNewPackageFiles({
    packageName: name,
    repositories: repositoriesFromOptions(options),
  });
  const createdPaths: string[] = [];
  const targetWasCreated = !existsSync(target);
  try {
    mkdirSync(target, { recursive: true });
    for (const file of files) {
      const filePath = join(target, file.path);
      const parent = dirname(filePath);
      const missingDirectories: string[] = [];
      let current = parent;
      while (current !== target && !existsSync(current)) {
        missingDirectories.push(current);
        current = dirname(current);
      }
      mkdirSync(parent, { recursive: true });
      createdPaths.push(...missingDirectories);
      writeFileSync(filePath, file.contents, { encoding: 'utf8', flag: 'wx' });
      createdPaths.push(filePath);
    }
  } catch (error) {
    for (const filePath of createdPaths.reverse()) rmSync(filePath, { force: true, recursive: true });
    if (targetWasCreated) rmSync(target, { recursive: true, force: true });
    return { code: 1, error: `unable to create package: ${error instanceof Error ? error.message : String(error)}` };
  }

  const relativeFiles = files.map((file) => file.path);
  console.log(`Created HagiTask package at ${target}`);
  console.log(relativeFiles.map((file) => `- ${file}`).join('\n'));
  console.log('Next: run `hagitask validate <path>` and add commands under commands/.');
  return { code: 0, packagePath: target, files: relativeFiles };
}
