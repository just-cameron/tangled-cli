# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev -- <args>   # Run CLI in development (use this, not ./tangled)
npm run build           # Compile TypeScript to dist/
npm test                # Run all tests once
npm run test:watch      # Run tests in watch mode
npm run typecheck       # Type-check without building (prefer over npx tsc --noEmit)
npm run lint            # Check with Biome
npm run lint:fix        # Auto-fix lint/format issues
```

Run a single test file:
```bash
npx vitest run tests/commands/issue.test.ts
```

## Architecture

`src/index.ts` is the entry point — it registers all commands and parses `process.argv`.

### Layer structure

- **`src/commands/`** — Commander.js command factories (e.g. `createIssueCommand()`). Each command: resumes session, gets repo context, calls lib functions, outputs results.
- **`src/lib/`** — Business logic with no Commander dependency:
  - `api-client.ts` — `TangledApiClient` wraps `AtpAgent`; `isAuthenticated()` is **synchronous**
  - `session.ts` — OS keychain storage via `@napi-rs/keyring`; throws `KeychainAccessError` if keychain is inaccessible (not just missing)
  - `context.ts` — Infers repo from `git remote` URLs; resolves `RepositoryContext` with owner DID/handle and repo name
  - `issues-api.ts` — All issue CRUD; exports `IssueData` (canonical JSON shape), `getCompleteIssueData`, `resolveSequentialNumber`
- **`src/utils/`** — Stateless helpers:
  - `auth-helpers.ts` — `requireAuth(client)` throws if unauthenticated (use in lib functions); `ensureAuthenticated(client)` for commands (calls `resumeSession`, exits on failure)
  - `validation.ts` — **All** validation logic lives here (Zod schemas + boolean helpers)
  - `formatting.ts` — `outputJson<T extends object>(data, fields?)`, `formatDate`, `formatIssueState`
  - `at-uri.ts` — Parse/build AT-URIs and repo AT-URIs
  - `body-input.ts` — Reads `--body` / `--body-file` / stdin (`-F -`)
- **`src/lexicon/`** — Auto-generated AT Protocol type definitions; regenerate with `npm run codegen`

### Key patterns

**Issue numbering** — Sequential numbers are not stored; they are computed by sorting all issues for a repo by `createdAt` ascending. The 1-based index is the display number.

**Issue state** — Stored as separate `sh.tangled.repo.issue.state` records. The latest record wins; default is `'open'` if no record exists.

**JSON output** — All issue sub-commands use `IssueCommand extends Command` (in `issue.ts`) to share a `--json [fields]` option. The canonical field set is: `number, title, body, state, author, createdAt, uri, cid`. Use `getCompleteIssueData()` to populate all fields.

**Auth flow** — Commands call `client.resumeSession()` directly, then proceed. Lib functions call `requireAuth(client)`. `KeychainAccessError` from `session.ts` propagates through `resumeSession()` without clearing metadata.

### Tests

Tests mirror `src/` under `tests/`. Command tests mock the entire `issuesApi` module:
```typescript
vi.mock('../../src/lib/issues-api.js');
// Use importOriginal to preserve exported classes/errors if needed
```
`isAuthenticated()` is synchronous — mock as `vi.fn(() => true)`, not `vi.fn(async () => true)`.
