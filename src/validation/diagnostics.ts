export interface ValidationError {
  packageId: string;
  file: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  packages: string[];
  errors: ValidationError[];
  valid: boolean;
}

export function formatValidationError(error: ValidationError): string {
  return `${error.packageId}: ${error.file}: ${error.field}: ${error.message}`;
}

export function formatValidationText(result: ValidationResult): string {
  const lines = [
    `HagiTask package validation ${result.valid ? 'passed' : 'failed'}`,
    `Packages discovered: ${result.packages.length}`,
    `Packages: ${result.packages.join(', ') || '(none)'}`,
    `Errors: ${result.errors.length}`,
  ];
  if (result.errors.length > 0) {
    lines.push('', ...result.errors.map((error) => `- ${formatValidationError(error)}`));
  }
  return lines.join('\n');
}
