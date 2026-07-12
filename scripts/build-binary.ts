#!/usr/bin/env bun

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const targetIndex = process.argv.indexOf('--target');
const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : undefined;
const outputIndex = process.argv.indexOf('--output');
const defaultName = process.platform === 'win32' ? 'tang.exe' : 'tang';
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : join('artifacts', defaultName);

if (!output) throw new Error('--output requires a path');
await mkdir(dirname(output), { recursive: true });

const args = ['build', 'src/index.ts', '--compile', '--minify', '--outfile', output];
if (target) args.push('--target', target);

console.log(`Building ${basename(output)}${target ? ` for ${target}` : ''}...`);
const child = Bun.spawn(['bun', ...args], { stdout: 'inherit', stderr: 'inherit' });
const code = await child.exited;
if (code !== 0) process.exit(code);
