#!/usr/bin/env node
/**
 * Post-process generated lexicon files to fix imports for ES modules
 *
 * This script:
 * 1. Adds .js extensions to relative imports
 * 2. Fixes multiformats/cid imports to use main package export
 * 3. Ensures proper TypeScript compatibility with NodeNext module resolution
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Recursively find all .ts files in a directory
function findTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Find all generated TypeScript files in src/lexicon
const files = findTsFiles('src/lexicon');

let filesFixed = 0;
let totalChanges = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  let modified = content;
  let fileChanges = 0;

  // Fix multiformats/cid import to use main package export
  // TypeScript can't resolve the subpath export with NodeNext resolution
  const multiformatsCidRegex = /from\s+['"]multiformats\/cid['"]/g;
  if (multiformatsCidRegex.test(modified)) {
    modified = modified.replace(multiformatsCidRegex, "from 'multiformats'");
    fileChanges++;
  }

  // Fix relative imports without .js extension
  // Match: from '../../something' or from "../something"
  // But don't match if it already has an extension
  const relativeImportRegex = /from\s+['"](\.\.[^'"]*?)(?<!\.js|\.ts)['"]/g;
  modified = modified.replace(relativeImportRegex, (match, path) => {
    fileChanges++;
    return `from '${path}.js'`;
  });

  if (fileChanges > 0) {
    writeFileSync(file, modified, 'utf-8');
    filesFixed++;
    totalChanges += fileChanges;
    console.log(`✓ Fixed ${fileChanges} import(s) in ${file}`);
  }
}

console.log(`\n✓ Fixed ${totalChanges} imports in ${filesFixed} files`);
