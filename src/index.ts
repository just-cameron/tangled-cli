#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('tangled')
  .description('A CLI for Tangled.org - AT Protocol-based Git hosting')
  .version(packageJson.version, '-v, --version', 'Output the current version');

// Future command registrations will go here
// Example:
// program
//   .command('auth')
//   .description('Authenticate with Tangled.org')
//   .action(() => {
//     console.log('Auth command coming soon!');
//   });

program.parse(process.argv);
