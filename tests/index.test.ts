import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

describe('Tangled CLI', () => {
  it('should display version', () => {
    const output = execSync('bunx tsx src/index.ts --version', {
      encoding: 'utf-8',
      cwd: join(__dirname, '..'),
    });
    expect(output.trim()).toBe(packageJson.version);
  });

  it('should display help', () => {
    const output = execSync('bunx tsx src/index.ts --help', {
      encoding: 'utf-8',
      cwd: join(__dirname, '..'),
    });
    expect(output).toContain('A CLI for Tangled.org');
    expect(output).toContain('Usage: tang');
    expect(output).toContain('Usage:');
  });

  it('package.json should have correct name', () => {
    expect(packageJson.name).toBe('tangled-cli');
  });
});
