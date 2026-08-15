import { validatePackages } from '../index.js';
import { formatValidationText } from '../validation/diagnostics.js';

export interface ValidateCommandOptions {
  json?: boolean;
}

export function runValidateCommand(path = process.cwd(), options: ValidateCommandOptions = {}): number {
  const result = validatePackages(path);
  const output = options.json
    ? JSON.stringify(result, null, 2)
    : formatValidationText(result);
  if (options.json || result.valid) console.log(output);
  else console.error(output);
  return result.valid ? 0 : 1;
}
