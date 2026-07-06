# tang

`tang` is a small TypeScript CLI for working with [Tangled](https://tangled.org) repositories from a terminal. It is designed for two overlapping users: humans who want `gh`-style repository commands, and agents that need predictable JSON output, repo-context inference, and loud failures instead of mystery web UI state.

Source of truth for this fork: <https://tangled.org/cameron.stream/tangled-cli>

## Status

Implemented today:

- AT Protocol auth/session commands (OAuth browser login, with an app-password fallback)
- SSH key upload/verification helpers
- local/global CLI config
- repository context inference from `tangled.org` git remotes
- issue create/list/view/edit/close/reopen
- pull request create/list/view
- `--json [fields]` output for script/agent use on supported commands

Not implemented yet:

- repository create/view commands
- pull request comments, reviews, merge, close/reopen
- CI/pipeline, labels, reactions, collaborator, fork, and secret-management commands

## Installation

This fork is currently installed from the repo, not from a registry package.

```bash
git clone git@tangled.org:cameron.stream/tangled-cli
cd tangled-cli
bun install
bun run build
bun link
```

Then verify:

```bash
tang --version
tang --help
```

For development without linking:

```bash
bun run dev -- --help
bun run dev -- issue list
```

## Authentication

`tang auth login` defaults to the AT Protocol OAuth loopback flow: it asks for your handle, opens your browser, receives the callback on `127.0.0.1`, and stores the session in the OS keychain. Use `tang auth login --app-password` for the legacy PDS app-password flow when OAuth is unavailable.

```bash
tang auth login
tang auth login --app-password
tang auth status
tang auth logout
```

Most issue and pull request commands require auth. If auth is missing, the CLI exits with a direct error:

```text
✗ Not authenticated. Run "tang auth login" first.
```

## Repository context

Run repo-scoped commands from inside a git repository whose remote points at Tangled:

```bash
git remote -v
# origin  git@tangled.org:cameron.stream/example-repo (fetch)
```

Then:

```bash
tang context
```

`tang context` resolves the Tangled owner, repo name, protocol, and remote. Commands use that context instead of asking the user or agent to manually supply repo DIDs.

Bare repo-DID remotes are also supported:

```bash
git remote add origin git@tangled.org:did:plc:...
```

## Commands

| Command | Description |
| :--- | :--- |
| `tang auth login` | Authenticate with OAuth in your browser |
| `tang auth login --app-password` | Authenticate with a PDS app password |
| `tang auth status` | Show whether a session is available |
| `tang auth logout` | Clear stored credentials |
| `tang ssh-key add <path>` | Upload a public SSH key |
| `tang ssh-key verify` | Verify SSH auth against Tangled |
| `tang config list` | List configurable keys |
| `tang config get [key]` | Read config |
| `tang config set <key> <value>` | Set config |
| `tang config unset <key>` | Clear config |
| `tang context` | Show resolved repo context |
| `tang issue create <title>` | Create an issue |
| `tang issue list` | List issues for the current repo |
| `tang issue view <issue-id>` | View an issue by number/rkey |
| `tang issue edit <issue-id>` | Edit issue title/body |
| `tang issue close <issue-id>` | Close an issue |
| `tang issue reopen <issue-id>` | Reopen an issue |
| `tang pr create --base <base> --head <head> --title <title>` | Create a pull request record from a branch diff |
| `tang pr list` | List pull requests for the current repo |
| `tang pr view <pr-id>` | View a pull request by number/rkey |

Use `--help` on any command for exact flags:

```bash
tang issue create --help
tang pr create --help
```

## Issue workflow

```bash
# from inside a Tangled-backed git repo
tang issue list
tang issue create "Bug: context resolution fails" --body "Steps and expected behavior."
tang issue view 1
tang issue edit 1 --title "Bug: repo DID context resolution fails"
tang issue close 1
tang issue reopen 1
```

Issue bodies can come from a flag, a file, or stdin:

```bash
tang issue create "Bug from file" --body-file ./issue.md
echo "stdin body" | tang issue create "Bug from stdin" --body-file -
```

## Pull request workflow

Create a normal git branch, commit your changes, and push the branch first:

```bash
git switch -c my-feature
# edit, test, commit
git push -u origin my-feature
```

Then create the Tangled pull request record:

```bash
tang pr create --base main --head my-feature --title "Add feature" --body-file ./pr.md
```

What `pr create` does:

1. Resolves the current Tangled repo from git remotes.
2. Checks whether the head branch is behind the base branch unless `--skip-behind-check` is set.
3. Generates `git diff <base>..<head>`.
4. Gzip-compresses the patch.
5. Uploads the patch blob through AT Protocol.
6. Creates a `sh.tangled.repo.pull` record.

List and view pull requests:

```bash
tang pr list
tang pr list --json number,title,state,sourceBranch,targetBranch
tang pr view 1
tang pr view <rkey>
```

## JSON output

Supported commands accept `--json [fields]`.

```bash
tang issue list --json number,title,state
tang pr list --json number,title,state,sourceBranch,targetBranch
```

Without a field list, JSON commands return the command's full canonical object shape. With a comma-separated field list, output is filtered for smaller agent/context payloads.

## Architecture

`src/index.ts` registers the Commander command tree. The code is split by responsibility:

- `src/commands/` — CLI command factories and terminal output
- `src/lib/` — API/business logic with no Commander dependency
- `src/utils/` — validation, AT-URI parsing, formatting, body input, auth helpers, git remote parsing
- `src/lexicon/` — generated Tangled/AT Protocol lexicon types
- `tests/` — Vitest coverage mirroring the source tree

Important implementation notes:

- Issue and PR display numbers are not stored in records. They are computed by sorting records by `createdAt` and using the 1-based index.
- Issue state is stored as separate `sh.tangled.repo.issue.state` records; the newest state record wins.
- PR state is stored as separate `sh.tangled.repo.pull.status` records; no status record means open.
- Cross-PDS issue/PR discovery uses Constellation backlinks to find records that reference the current repo AT-URI.
- All validation helpers belong in `src/utils/validation.ts`.

## Development

Prerequisites:

- Node.js 22+
- Bun

Install dependencies:

```bash
bun install
```

Useful scripts:

```bash
bun run dev -- --help
bun run typecheck
bun run build
bun run test
bun run lint
bun run lint:fix
bun run format
```

Run a single test file:

```bash
bunx vitest run tests/commands/pr.test.ts
```

Before pushing a change:

```bash
bun run typecheck
bun run build
bun run test
bun run lint
```

## Project structure

```text
tangled-cli/
├── src/
│   ├── commands/
│   ├── lib/
│   ├── lexicon/
│   ├── utils/
│   └── index.ts
├── tests/
├── scripts/
├── lexicons/
├── package.json
└── README.md
```
