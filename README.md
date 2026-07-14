# tang

`tang` is an independent, automation-first CLI for [Tangled](https://tangled.org). It gives humans and coding agents one command surface for repository context, issues, pull requests, and Spindle CI without scraping the web UI.

Source of truth: <https://tangled.org/cameron.stream/tangled-cli>

## Install

Published releases support three paths:

```bash
# npm (Node 22+)
npm install --global tangled-cli

# or download a checksummed tang-{platform}-{arch} binary from the release page
# https://github.com/just-cameron/tangled-cli/releases

# source checkout
git clone git@tangled.org:cameron.stream/tangled-cli
cd tangled-cli
bun install --frozen-lockfile
bun run build
bun link
```

Tagged releases build Linux, macOS, and Windows binaries, attach SHA-256 files, and publish the npm package with provenance. Those artifacts are suitable inputs for a Homebrew tap; the tap formula should pin the release URL and checksum rather than building the repository at install time.

The Tangled repository is authoritative. GitHub is a release mirror used to run the cross-platform artifact workflow; tag the same revision in both places. Maintainers must configure the mirror's `NPM_TOKEN` Actions secret before cutting a release.
The npm `repository` metadata points at that public mirror because npm provenance requires it to exactly match the GitHub repository that performs the publish.

Verify the installation:

```bash
tang --version
tang doctor
```

## Authenticate

OAuth is the default. The browser callback binds to loopback only, and session secrets are stored in the OS keychain.

```bash
tang auth login
tang auth status
tang auth status --diagnostic     # expiry/scope/audience; token value stays hidden
tang auth logout                  # confirms before deleting the session
```

On macOS, `tang` stores OAuth credentials in the login Keychain and accesses
them through Apple's stable `/usr/bin/security` helper. The normal login flow
does not ask you to enter any Keychain item data: provide your handle, approve
the browser login, and `tang` stores the resulting session automatically. If a
legacy item needs authorization, macOS may show its standard system dialog;
enter a Mac login password only in that recognizable dialog. A terminal prompt
that says `password data for new item` is never an instruction to enter an
account or Mac password.

Legacy PDS app passwords remain available:

```bash
tang auth login --app-password
```

`auth status --show-token` exists for exceptional debugging. It refuses JSON and non-interactive output, then presents a warning and requires confirmation. Tokens grant account access and should not be pasted into issues, logs, or agent prompts.

## Select a repository

Repo-scoped commands use the first available selector in this order:

1. global `--repo <selector>`
2. `TANG_REPO`
3. configured remote (`TANGLED_REMOTE`, `.tangledrc`, or user config)
4. a Tangled Git remote in the current checkout

Accepted selectors include:

```text
owner.handle/repository
did:plc:owner/repository
did:plc:repository
at://did:plc:owner/sh.tangled.repo/<rkey>
https://tangled.org/owner.handle/repository
```

Examples:

```bash
tang --repo cameron.stream/tangled-cli context
TANG_REPO=did:plc:... tang issue list
tang context --json
```

Resolution follows the repository record to its stable repository DID and discovers its knot and Spindle. Public reads go to the record owner's authoritative PDS when a signed-in PDS cannot serve a foreign record.

## Global automation flags

```text
--repo <selector>  operate outside a Git checkout
--json             machine-readable output
--fields <fields>  filter comma-separated fields when using global --json
--no-input         never prompt; fail with a remediation instead
-y, --yes          grant confirmation to commands that support it
```

Environment equivalents:

```text
TANG_REPO
TANG_JSON=1
TANG_NO_INPUT=1
TANG_YES=1
```

Precedence is explicit command flag → environment → discovered/configured context. `--no-input` never implies consent: a destructive action also needs `--yes`.

## Issues and pull requests

```bash
tang issue list --all
tang issue create "Context fails across PDSes" --body-file issue.md
tang issue view <rkey>
tang issue close <rkey>

tang pr create --base main --head feature --title "Add feature" --body-file pr.md
tang pr list --all
tang pr view <rkey>
tang pr delete <rkey> --yes
```

List commands support `--cursor`, `--limit`, and `--all`. Bodies accept flags, files, or stdin (`--body-file -`). Pull creation checks whether the head is behind its base, builds and compresses the Git patch, uploads it as an AT Protocol blob, then creates the pull record.

### Identifier warning

Tangled issue and pull records do **not** store sequential numbers. The app view may display numbers, while `tang` can only compute a deterministic 1-based order after collecting the full record set. Therefore:

- use an AT-URI or exact rkey in scripts;
- treat `#12` as a human-facing fallback, not a durable automation ID;
- JSON includes `id`, `uri`, and `numberKind` so callers can make that distinction;
- numeric resolution emits a warning.

## Pipelines and CI

Pipeline commands use the current `sh.tangled.ci.*` Spindle XRPC namespace directly:

```bash
tang pipeline list
tang ci list --all                         # `ci` aliases `pipeline`
tang pipeline view <pipeline-tid>
tang pipeline logs <pipeline-tid>
tang pipeline logs <pipeline-tid> -w check

tang run --sha "$(git rev-parse HEAD)"      # top-level dispatch shortcut
tang pipeline run -w check -i mode=full
tang pipeline retry <pipeline-tid> --yes
tang pipeline cancel <pipeline-tid> --yes
tang pipeline cancel <pipeline-tid> -w site --yes
```

`list` and `view` are public Spindle queries. `run`, `retry`, and `cancel` mint method-bound service-auth tokens through the signed-in PDS, then call the repository's configured Spindle. `logs` opens the Spindle subscription and decodes AT Protocol CBOR event frames; it does not scrape or proxy through the Tangled website.

## JSON contracts

Examples:

```bash
tang issue list --json
tang issue list --json id,title,state
tang pipeline list --json id,status,commit
tang pipeline logs <id> --json
```

Paginated list output is an envelope:

```json
{
  "items": [],
  "count": 0,
  "nextCursor": "optional opaque cursor",
  "addressing": "issues and pulls also carry the identifier warning"
}
```

Field selection filters objects inside `items`, not envelope metadata. Streaming logs are newline-delimited JSON: one complete event object per stdout line. In JSON mode, normal status prose stays off stdout; failures use stderr and a nonzero exit status.

## Diagnostics

```bash
tang doctor
tang doctor --json
```

The doctor checks the runtime, config directory, DID resolution, live authentication, repository selection/resolution, Spindle discovery/query access, and Git. It prints concrete remediation for warnings and failures and exits nonzero for failed checks.

## Command map

```text
tang auth login|status|logout
tang ssh-key add|verify
tang config list|get|set|unset
tang context
tang doctor
tang issue create|list|view|edit|close|reopen
tang pr create|list|view|delete
tang label defs|list|add|remove
tang pipeline|ci list|view|logs|run|retry|cancel
tang run
```

Use `tang <command> --help` for exact flags.

## Development

Prerequisites are Node 22+ and Bun.

```bash
bun install --frozen-lockfile
bun run dev -- --help
bun run check            # typecheck + Biome + Vitest
bun run build
bun run build:binary
```

Architecture:

- `src/commands/` — Commander adapters and terminal contracts
- `src/lib/` — repository resolution, addressing, PDS access, API, and CI logic
- `src/lexicon/` — generated record-oriented Tangled types
- `lexicons/` — vendored Tangled schemas, including current CI XRPC schemas
- `tests/` — unit and command tests

Update vendored schemas with `bun run update-lexicons`. CI lexicons are intentionally not fed to the record code generator because they describe queries, procedures, and subscriptions; `src/lib/ci-api.ts` implements that transport boundary directly.
