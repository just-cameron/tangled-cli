# Vendored Lexicons

This directory contains vendored copies of AT Protocol lexicon definitions for the Tangled.org service.

## Source

These lexicons are downloaded from the tangled.org core repository:
- **Source**: `https://tangled.org/tangled.org/core/raw/master/lexicons/`
- **Repository**: `https://tangled.org/tangled.org/core`
- **Last Updated**: 2026-02-09

## Structure

- `sh/tangled/` - Tangled-specific lexicons
  - `issue/` - Issue record types
  - `pulls/` - Pull request record types
  - `repo/` - Repository record types
  - `label/` - Label/tag record types
  - `pipeline/` - CI/CD pipeline types
  - `actor/`, `feed/`, `graph/`, `git/`, `knot/`, `spindle/`, `string/` - Other types

## Updating Lexicons

When Tangled.org updates their lexicon schemas, run the update script:

```bash
npm run update-lexicons
```

This script:
1. Downloads the latest lexicon files from tangled.org over HTTPS
2. Saves them to the `lexicons/` directory
3. Preserves the directory structure

After updating lexicons:
1. Update the "Last Updated" date in this README
2. Regenerate client code: `npm run codegen`
3. Run tests to ensure compatibility: `npm test`
4. Commit both lexicon updates and generated code changes

**Manual Update** (if script fails):
- Lexicons can be manually downloaded from: `https://tangled.org/tangled.org/core/raw/master/lexicons/<path>`
- Example: `https://tangled.org/tangled.org/core/raw/master/lexicons/issue/issue.json`

## Code Generation

Client TypeScript code is generated from these lexicons using `@atproto/lex-cli`:

```bash
npm run codegen
```

This generates type-safe client code in `src/lexicon/` which is committed to version control.
