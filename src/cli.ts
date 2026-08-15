#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runValidateCommand } from './commands/validate-command.js';

function packageVersion(): string {
  try {
    const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    return JSON.parse(readFileSync(packagePath, 'utf8')).version;
  } catch {
    return '0.1.0';
  }
}

export function createCli(): Command {
  const program = new Command();
  program
    .name('hagitask')
    .description('Validate HagiTask preset and community packages offline.')
    .version(packageVersion());
  program
    .command('validate [path]')
    .description('validate packages under presets/, data/, or a single package directory')
    .option('--json', 'print machine-readable JSON diagnostics')
    .action((path: string | undefined, options: { json?: boolean }) => {
      process.exitCode = runValidateCommand(path ?? process.cwd(), options);
    });
  return program;
}

export function main(argv = process.argv): void {
  createCli().parse(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
