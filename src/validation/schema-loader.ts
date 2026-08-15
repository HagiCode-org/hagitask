import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

export interface SchemaLoader {
  hasSchema(name: string): boolean;
  validate(name: string, value: unknown): ErrorObject[];
  resolveReference(reference: string): string | undefined;
}

function schemaFileName(reference: string): string {
  const normalized = reference.replaceAll('\\', '/');
  const marker = 'schemas/task-preset-plugin/';
  const index = normalized.indexOf(marker);
  return index >= 0 ? normalized.slice(index + marker.length) : basename(normalized);
}

export function createSchemaLoader(targetRoot: string, packageRoot: string): SchemaLoader {
  const roots = [
    join(resolve(targetRoot), 'schemas', 'task-preset-plugin'),
    join(resolve(packageRoot), 'schemas', 'task-preset-plugin'),
  ];
  const schemaRoot = roots.find((root) => existsSync(root));
  const validators = new Map<string, ValidateFunction>();
  const ajv = new Ajv2020({ strict: false, allErrors: true });

  if (schemaRoot) {
    for (const file of readdirSync(schemaRoot)) {
      if (!file.endsWith('.json')) continue;
      try {
        const schema = JSON.parse(readFileSync(join(schemaRoot, file), 'utf8'));
        validators.set(file, ajv.compile(schema));
      } catch {
        // Broken schemas are reported as unavailable rather than crashing validation.
      }
    }
  }

  return {
    hasSchema(name) {
      return validators.has(name);
    },
    resolveReference(reference) {
      const name = schemaFileName(reference);
      return validators.has(name) ? name : undefined;
    },
    validate(name, value) {
      const validator = validators.get(name);
      if (!validator) return [];
      return validator(value) ? [] : (validator.errors ?? []);
    },
  };
}

export function schemaErrorLocation(error: ErrorObject): string {
  return error.instancePath || '<root>';
}
