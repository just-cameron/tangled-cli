# TODO.md: Tangled CLI Development Plan

This document outlines the development tasks for the Tangled CLI, based on the `README.md` and project goals.

## 1. Project Setup & Core Structure (Commander.js)

- [ ] Initialize Node.js project.
- [ ] Install `commander` for CLI routing.
- [ ] Implement basic CLI command structure (e.g., `tangled --version`, `tangled --help`).
- [ ] Set up TypeScript configuration.
- [ ] Configure linting and formatting (ESLint, Prettier).
- [ ] Configure vitest for testing.

## 2. Authentication (Auth)

- [ ] Implement `tangled auth login` command.
  - [ ] Collect user's PDS handle and app password.
  - [ ] Implement session storage using an OS keychain library (e.g., `keytar`) for secure, cross-platform token management.
  - [ ] Integrate `@atproto/api` for XRPC client and session management.
- [ ] Implement `tangled auth logout` command.

## 3. Git SSH Key Management

- [ ] Implement `tangled ssh-key add <public-key-path>` command.
  - [ ] This command should upload the provided public SSH key to the user's tangled.org account via the API, similar to how `gh ssh-key add` works.
  - [ ] The CLI is not responsible for generating SSH keys or managing the local ssh-agent; users are expected to handle these steps externally.
- [ ] Implement `tangled ssh-key verify` command.
  - [ ] This command should execute `ssh -T git@tangled.org`, parse the DID from its output, and then resolve that DID to a Bluesky handle, displaying the result to the user.
- [ ] Ensure all Git operations leverage SSH keys for authentication, as `tangled.org` exclusively supports SSH for Git.

## 4. Context Engine (Git Integration)

- [ ] Integrate `git-url-parse` to resolve Tangled DID/NSID from `.git/config` remote URLs.
- [ ] Develop a "Context Resolver" module to infer repository context (DID) from the current working directory.
- [ ] Implement fallback mechanisms if no git remote is found or DID cannot be resolved (error handling).
- [ ] Integrate `simple-git` for safe local git operations.
- [ ] Implement logic to parse the DID from `ssh -T git@tangled.org` output (will be reused by `tangled ssh-key verify`).
- [ ] Implement functionality to resolve a DID (e.g., `did:plc:b2mcbcamkwyznc5fkplwlxbf`) into a human-readable Bluesky handle (will be reused by `tangled ssh-key verify`).

## 5. Repository Management

- [ ] Implement `tangled repo create <repo-name>` command.
- [ ] Implement `tangled repo view` command (display repo details).
  - [ ] Support `--json` output with field filtering (e.g., `--json name,cloneUrl,description`) using `lodash/pick`).

## 6. Issue Management

- [ ] Implement `tangled issue create "<title>" [--body "<body>" | --body-file <file> | -F -]` command.
- [ ] Implement `tangled issue list [--json "id,title"]` command.
  - [ ] Support `--json` output with field filtering.

## 7. Pull Request Management

This section outlines the phased implementation for Pull Request (PR) support, following `gh` CLI patterns.

### Phase 1: Creating a Pull Request from a Branch (Author Workflow)

- [ ] Implement `tangled pr create --base <base-branch> --head <head-branch> --title <title> [--body <body> | --body-file <file> | -F -]` command.
  - [ ] Generate the `git diff` patch between the `--head` and `--base` branches.
  - [ ] Upload the generated patch as a blob using `com.atproto.repo.uploadBlob` (or equivalent).
  - [ ] Create a `sh.tangled.repo.pull` record using `com.atproto.repo.createRecord`, including `target` (repo and base branch), `source` (head branch and SHA), `title`, `body`, and the `patchBlob` reference.
- [ ] Implement `tangled pr list [--json <fields>]` command to list pull requests for the current repository.
  - [ ] Use `com.atproto.repo.listRecords` with `collection: "sh.tangled.repo.pull"`.
- [ ] Implement `tangled pr view <id> [--json <fields>]` command to display detailed information about a specific pull request.
  - [ ] Use `com.atproto.repo.getRecord` for the `sh.tangled.repo.pull` record.
  - [ ] Fetch associated comments using `com.atproto.repo.listRecords` with `collection: "sh.tangled.repo.pull.comment"`.

### Phase 2: Working as a Reviewer (Commenting)

- [ ] Implement `tangled pr comment <id> [--body <body> | --body-file <file> | -F -]` command.
  - [ ] Create a `sh.tangled.repo.pull.comment` record using `com.atproto.repo.createRecord`, linking it to the pull request's AT-URI.
- [ ] Implement `tangled pr review <id> --comment <comment> [--approve | --request-changes]` command.
  - [ ] Create a `sh.tangled.repo.pull.comment` record.
  - [ ] Update the `sh.tangled.repo.pull.status` record (if applicable) to reflect approval or requested changes. (Further API research might be needed to map approve/request-changes to status updates).

### Phase 3: Responding to a Review (Author Workflow)

- [ ] This phase primarily involves local Git operations (pushing new commits) and using `tangled pr comment` for clarifications, which are covered by existing or planned commands.

## 8. Output & LLM Integration

- [ ] Implement output formatting based on `is-interactive` check.
  - [ ] "Human Mode" (TTY): Use `cli-table3` for pretty tables.
  - [ ] "Machine Mode" (Pipe/`--json`): Plain text or JSON output.
- [ ] Implement `--json` flag for structured output.
- [ ] Implement `--no-input` flag to force CLI to error on unresolved context or missing flags (Fail Fast, Fail Loud principle).

## 9. Testing

- [ ] Set up a testing framework (e.g., Jest, Vitest).
- [ ] Write unit tests for core modules (Auth, Context Resolver, API client).
- [ ] Write integration tests for CLI commands.

## 10. Documentation & Deployment

- [ ] Generate CLI help documentation (`commander` usually handles this).
- [ ] Consider packaging/distribution strategy (npm, standalone binary).

## 11. Outstanding Issues / Future Considerations (from README)

- [ ] Secure cross-platform AT Proto session storage (OS keychain).
- [ ] Git authentication management similar to GitHub CLI (SSH keys, 1Password integration).
- [ ] Define clear precedence order for settings resolution (local config, home folder, CLI flags).
- [ ] Consider adding extensions/plugins (Out of Scope for V1, but keep in mind).
