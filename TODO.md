# TODO.md: Tangled CLI Development Plan

This document outlines the development tasks for the Tangled CLI, based on the `README.md` and project goals.

## Project Setup & Core Structure (Commander.js)

- [x] Initialize Node.js project.
- [x] Install `commander` for CLI routing.
- [x] Implement basic CLI command structure (e.g., `tangled --version`, `tangled --help`).
- [x] Set up TypeScript configuration.
- [x] Configure linting and formatting (Biome).
- [x] Configure vitest for testing.

## Authentication (Auth)

- [x] Implement `tangled auth login` command.
  - [x] Collect user's PDS handle and app password.
  - [x] Implement session storage using an OS keychain library (e.g., `keytar`) for secure, cross-platform token management.
  - [x] Integrate `@atproto/api` for XRPC client and session management.
- [x] Implement `tangled auth logout` command.

## Git SSH Key Management

- [x] Implement `tangled ssh-key verify` command.
  - [x] This command executes `ssh -T git@tangled.org`, parses the DID from its output, and displays it to the user.
  - [x] If the user is logged in with the CLI and their DID matches the SSH DID, their handle is also displayed.

## Context Engine (Git Integration)

- [x] Develop a "Context Resolver" module to infer repository context (DID) from the current working directory.
  - [x] Start by using the current Git repository context.
    - [x] Integrate `git-url-parse` to resolve Tangled DID/NSID from `.git/config` remote URLs. Using `simple-git` if needed.
    - [x] If multiple remotes exist, look for one at tangled.org, then prompt the user to select remote if ambiguity remains.
    - [x] Fallback to prompting the user to add a remote for their Tangled repository if none are found.
  - [x] Avoid creating a config file in V1; rely on Git remotes and CLI flags for context.
    - [x] If a config is needed remember that the precedence order should be: CLI flags > local config > home folder config. Users may prefer different settings per repo (such as unique remote names, etc).

## Issue Management

- [ ] Implement `tangled issue create "<title>" [--body "<body>" | --body-file <file> | -F -]` command.
- [ ] Implement `tangled issue list [--json "id,title"]` command.
  - [ ] Support `--json` output with field filtering.
- [ ] Migrate this TODO list into Tangled issues once issue creation is implemented. (note defects and address blocking features as needed).
  - [ ] Create phases in this todo list, and then use `- [ ]` tasks in the issue descriptions.
  - [ ] Remove TODO.md once all tasks are migrated to issues.

## Pull Request Management

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
  - [ ] Dogfood the CLI by using it to create a pull request for these changes, and then view the created PR to ensure all data is correctly stored and retrieved.

### Phase 2: Working as a Reviewer (Commenting)

- [ ] Implement `tangled pr comment <id> [--body <body> | --body-file <file> | -F -]` command.
  - [ ] Create a `sh.tangled.repo.pull.comment` record using `com.atproto.repo.createRecord`, linking it to the pull request's AT-URI.
- [ ] Implement `tangled pr review <id> --comment <comment> [--approve | --request-changes]` command.
  - [ ] Create a `sh.tangled.repo.pull.comment` record.
  - [ ] Update the `sh.tangled.repo.pull.status` record (if applicable) to reflect approval or requested changes. (Further API research might be needed to map approve/request-changes to status updates).

### Phase 3: Responding to a Review (Author Workflow)

- [ ] This phase primarily involves local Git operations (pushing new commits) and using `tangled pr comment` for clarifications, which are covered by existing or planned commands.

## Repository Management

- [ ] Implement `tangled repo create <repo-name>` command.
- [ ] Implement `tangled repo view` command (display repo details).
  - [ ] Support `--json` output with field filtering (e.g., `--json name,cloneUrl,description`) using `lodash/pick`).

## SSH Key Upload & Management (Phase 4)

This phase adds CLI-based SSH key management for users who want to upload keys programmatically.

- [ ] Implement `tangled ssh-key add <public-key-path>` command.
  - [ ] This command should upload the provided public SSH key to the user's tangled.org account via the API, similar to how `gh ssh-key add` works. If no path is provided, it should default to `~/.ssh/id_ed25519.pub` or prompt the user for a path.
  - [ ] Support reading keys from SSH agent via `ssh-add -L` for 1Password SSH agent users.
  - [ ] The CLI is not responsible for generating SSH keys or managing the local ssh-agent; users are expected to handle these steps externally.
- [ ] Implement `tangled ssh-key list` command.
  - [ ] List all SSH keys stored in the user's PDS.
  - [ ] Display key type, name, creation date, and URI.

## Output & LLM Integration

- [ ] Implement output formatting based on `is-interactive` check.
  - [ ] "Human Mode" (TTY): Use `cli-table3` for pretty tables.
  - [ ] "Machine Mode" (Pipe/`--json`): Plain text or JSON output.
- [ ] Implement `--json` flag for structured output.
- [ ] Implement `--no-input` flag to force CLI to error on unresolved context or missing flags (Fail Fast, Fail Loud principle).

## Testing

- [x] Set up a testing framework (Vitest).
- [x] Write unit tests for core modules (Auth, Session, API client, Validation, Prompts).
- [x] Write integration tests for CLI commands (Auth, SSH key verify).
- [ ] Add integration tests for remaining commands as they are implemented.

## Documentation & Deployment

- [ ] Generate CLI help documentation (`commander` usually handles this).
- [ ] Consider packaging/distribution strategy (npm, standalone binary).

## Outstanding Issues / Future Considerations (from README)

- [x] Secure cross-platform AT Proto session storage (OS keychain) - Implemented with @napi-rs/keyring.
- [x] SSH key verification for Git authentication - Implemented `tangled ssh-key verify`.
- [ ] SSH key upload management (See Phase 4 above).
- [ ] 1Password SSH agent integration for key upload (See Phase 4 above).
- [ ] Define clear precedence order for settings resolution (local config, home folder, CLI flags).
- [ ] Consider adding extensions/plugins (Out of Scope for V1, but keep in mind).
