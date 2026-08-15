import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPackages } from './validation/package-discovery.js';
import { validateDiscoveredPackages } from './validation/package-validator.js';
export type { DiscoveredPackage, DiscoveryResult } from './validation/package-discovery.js';
export type { ValidationError, ValidationResult } from './validation/diagnostics.js';

export const PACKAGE_NAME = '@hagicode/hagitask';
export const PACKAGE_VERSION = '0.1.0';
export const packageMetadata = {
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
} as const;

export interface ValidateOptions {
  /** Override the directory containing the published schemas. */
  packageRoot?: string;
}

export function validatePackages(
  targetPath = process.cwd(),
  options: ValidateOptions = {},
) {
  const root = resolve(targetPath);
  const discovery = discoverPackages(root);
  const packageRoot = options.packageRoot ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (discovery.errors.length > 0) {
    return {
      packages: discovery.packages.map((pkg) => pkg.rel).sort(),
      errors: discovery.errors.map((message) => ({
        packageId: '',
        file: root,
        field: 'path',
        message,
      })),
      valid: false,
    };
  }
  return validateDiscoveredPackages(discovery.packages, root, packageRoot);
}

export { discoverPackages } from './validation/package-discovery.js';
export { formatValidationError, formatValidationText } from './validation/diagnostics.js';
