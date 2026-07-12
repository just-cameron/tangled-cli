/**
 * Process-local options inherited by every command.
 *
 * Commander keeps parent and child options separate. This small runtime bridge
 * lets library code honor the global automation contract without threading the
 * root Command object through every action handler.
 */

export interface GlobalRuntimeOptions {
  repo?: string;
  json?: boolean;
  fields?: string;
  noInput?: boolean;
  yes?: boolean;
  quiet?: boolean;
}

let runtimeOptions: GlobalRuntimeOptions = {};

export function setRuntimeOptions(options: GlobalRuntimeOptions): void {
  runtimeOptions = { ...options };
}

export function getRuntimeOptions(): Readonly<GlobalRuntimeOptions> {
  return runtimeOptions;
}

export function resetRuntimeOptions(): void {
  runtimeOptions = {};
}

export function wantsJson(localValue?: boolean | string): boolean {
  return localValue !== undefined ? Boolean(localValue) : runtimeOptions.json === true;
}

export function requestedFields(localValue?: string | boolean): string | undefined {
  if (typeof localValue === 'string') return localValue;
  return runtimeOptions.fields;
}

export function inputAllowed(): boolean {
  return runtimeOptions.noInput !== true;
}

export function confirmationGranted(localValue?: boolean): boolean {
  return localValue === true || runtimeOptions.yes === true;
}
