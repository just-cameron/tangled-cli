# Tangled CLI: Architecture & Implementation Plan

## 1. Project Overview

**Goal:** Create a context-aware CLI for tangled.org that bridges the gap between the AT Protocol (XRPC) and standard Git. **Philosophy:** Follow the **GitHub CLI (gh)** standard: act as a wrapper that creates a seamless experience where the API and local Git repo feel like one unified tool.

## 2. Prior Art Analysis: GitHub CLI (gh) vs. Tangled CLI

| Feature        | GitHub CLI (gh) Approach                             | Tangled CLI Strategy                                                                                                       |
| :------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Context**    | Infers repo from .git/config remote URL.             | **Must-Have:** Parse .git/config to resolve did:plc:... from the remote URL.                                               |
| **Auth**       | Stores oauth token; acts as a git-credential-helper. | **Plan:** Store AT Proto session; inject auth headers into git operations if possible, or manage SSH keys via API.         |
| **Output**     | TTY \= Tables. Pipe \= Text. \--json \= Structured.  | **Plan:** Use is-interactive check. Default to "Human Mode". Force "Machine Mode" via flags.                               |
| **Filtering**  | \--json name,url (filters fields).                   | **Plan:** Support basic \--json flag first. Add field filtering (--json "cloneUrl,did") to save LLM context window tokens. |
| **Extensions** | Allows custom subcommands.                           | _Out of Scope for V1._                                                                                                     |

## 3. High-Level Architecture (Refined)

The CLI acts as a "Context Engine" before it even hits the API.
`graph TD`
`User[User / LLM] -->|Command| CLI`

    `subgraph "Context Engine"`
        `Git[Local .git/config] -->|Read Remote| Resolver[Context Resolver]`
        `Resolver -->|Inferred DID| Payload`
    `end`

    `subgraph "Execution"`
        `Payload -->|XRPC Request| API[Tangled AppView]`
        `Payload -->|Git Command| Shell[Git Shell]`
    `end`

    `API --> Output`
    `Shell --> Output`

## 4. Tech Stack (TypeScript)

| Component         | Library               | Purpose                                                       |
| :---------------- | :-------------------- | :------------------------------------------------------------ |
| **Framework**     | **commander**         | Routing (tangled repo create).                                |
| **API Client**    | **@atproto/api**      | Official XRPC client & session management.                    |
| **Git Context**   | **git-url-parse**     | **New:** Parses remote URLs to extract the Tangled DID/NSID.  |
| **Git Ops**       | **simple-git**        | Wraps local git operations safely.                            |
| **Validation**    | **zod**               | Validates inputs & generates schemas for LLMs.                |
| **Interactivity** | **@inquirer/prompts** | Modern prompts for humans.                                    |
| **Formatting**    | **cli-table3**        | **New:** For gh-style pretty tables in Human Mode.            |
| **OS Keychain**   | **keytar**            | **New:** To securely store session tokens in the OS keychain. |

## 5. Agent Integration (The "LLM Friendly" Layer)

To make this tool accessible to Claude Code/Gemini, we adopt gh's best patterns:

### Rule 1: Context is King

LLMs often hallucinate repo IDs.

- **Design:** If the user/LLM runs tangled issue list inside a folder, **do not** ask for the repo DID. Infer it.
- **Fallback:** Only error if no git remote is found.

### Rule 2: Precision JSON (--json \<fields\>)

LLMs have token limits. Returning a 50KB repo object is wasteful.

- **Feature:** tangled repo view \--json name,cloneUrl,description
- **Implementation:** Use lodash/pick to filter the API response before printing to stdout.

### Rule 3: Fail Fast, Fail Loud

LLMs can't read error messages buried in HTML or long stack traces. Provide a `--no-input` flag that forces the CLI to error if it can't resolve context or if required flags are missing.

### Rule 4: Flexible Input for Issue Bodies

Following `gh`'s pattern, `tangled issue create` will support various ways to provide the issue body, making it LLM-friendly and flexible for scripting. It will accept:

- `--body "Text"` or `-b "Text"` for a direct string.
- `--body-file ./file.md` or `-F ./file.md` to read from a file.
- `--body-file -` or `-F -` to read from standard input (stdin).

### Summary of Improvements

- **Context Inference:** This is the "killer feature" of gh that we are copying. It makes the tool usable for humans and safer for LLMs (less typing = fewer errors).
- **Filtered JSON:** Saves tokens for LLM context windows.
- **Git Config Integration:** Treats the local .git folder as a database of configuration, reducing the need for environment variables or complex flags.
- **Flexible Issue Body Input:** Improves usability for both humans and LLMs by allowing diverse input methods for issue descriptions.

## 6. Examples Tangled CLI Usage

```bash
tangled auth login (opens a browser for auth)
tangled repo create my-new-repo
cd my-new-repo
tangled issue create "Bug: Something is broken" --body "Detailed description of the bug here."
echo "Another bug description from stdin." | tangled issue create "Bug: From stdin" --body-file -
tangled issue list --json "id,title"
tangled pr create --base main --head my-feature --title "Add new feature" --body-file ./pr_description.md
tangled pr view 123
tangled pr comment 123 --body "Looks good, small change needed."
```

## 7. Basic Commands

Basic commands include auth, key management, repo creation, issue management, and pull request management.

`tangled auth login`

- Logs in the user, ideally through a web browser flow for security.
  `tangled auth logout`
- Logs out the user, clearing the session.
  `tangled ssh-key add <public-key-path>`
- Uploads the provided public SSH key to the user's tangled.org account via the API.
  `tangled ssh-key verify`
- Verifies that the user's SSH key is correctly set up and can authenticate with tangled.org. Returns the associated DID and handle if successful.
  `tangled repo create <repo-name>`
- Creates a new repository under the user's account.
  `tangled repo view [--json <fields>]`
- Displays details about the current repository. If `--json` is provided, outputs only the specified fields in JSON format.
  `tangled issue create "<title>" [--body "<body>" | --body-file <file> | -F -]`
- Creates a new issue in the current repository with the given title and optional body, which can be provided via flag, file, or stdin.
  `tangled pr create --base <base-branch> --head <head-branch> --title <title> [--body <body> | --body-file <file> | -F -]`
- Creates a new pull request in the current repository from a head branch to a base branch.
  `tangled pr list [--json <fields>]`
- Lists pull requests for the current repository.
  `tangled pr view <id> [--json <fields>]`
- Displays detailed information about a specific pull request, including comments.
  `tangled pr comment <id> [--body <body> | --body-file <file> | -F -]`
- Adds a comment to a pull request.
  `tangled pr review <id> --comment <comment> [--approve | --request-changes]`
- Submits a review for a pull request, with optional approval or request for changes.

## 8. Design Decisions & Outstanding Issues

This section documents key design decisions and tracks outstanding architectural questions.

### 1. (Resolved) SSH Key Management (`gh` Compatibility)

- **Original Question:** How does `gh` manage SSH keys, and can we follow that pattern?
- **Resolution:** Analysis shows that `gh` does _not_ manage private keys. It facilitates uploading the user's _public_ key to their GitHub account. The local SSH agent handles the private key.
- **Our Approach:** The `tangled ssh-key add` command follows this exact pattern. It provides a user-friendly way to upload a public key to `tangled.org`. This resolves the core of this issue, as it is compatible with external key managers like 1Password's SSH agent.

### 2. (Decided) Secure Session Storage

- **Original Question:** How should we securely store the AT Proto session token?
- **Resolution:** Storing sensitive tokens in plaintext files is not secure.
- **Our Approach:** The CLI will use the operating system's native keychain for secure storage (e.g., macOS Keychain, Windows Credential Manager, or Secret Service on Linux). A library like `keytar` will be used to abstract the platform differences.

### 3. (Decided) Configuration Resolution Order

- **Original Question:** How should settings be resolved from different sources?
- **Resolution:** A clear precedence order is necessary.
- **Our Approach:** The CLI will resolve settings in the following order of precedence (highest first):
  1.  Command-line flags (e.g., `--repo-did ...`)
  2.  Environment variables (e.g., `TANGLED_REPO_DID=...`)
  3.  Project-specific config file (e.g., `.tangled/config.yml` in the current directory)
  4.  Global user config file (e.g., `~/.config/tangled/config.yml`)

### 4. (Decided for V1) Authentication Flow: App Passwords (PDS)

- **Original Question:** Can we allow auth through a web browser?
- **Resolution:** For the initial version, the CLI will use **App Passwords** for authentication. This is the standard and simplest method for third-party AT Protocol clients and aligns with existing practices.
- **`tangled auth login` Flow:** When running `tangled auth login`, the CLI will prompt the user for their **PDS handle** (e.g., `@mark.bsky.social`) and an **App Password**.
- **Generating an App Password:** Users typically generate App Passwords from their PDS's settings (e.g., in the official Bluesky app under "Settings -> App Passwords", or on their self-hosted PDS web interface). The CLI **does not** generate app passwords.
- **Session Management:** The session established is with the user's PDS, and this authenticated session is then used to interact with `tangled.org`'s App View/Service.
- **OAuth Support:** Implementing a web-based OAuth flow (similar to `gh`'s approach) is more complex and not a standard part of the AT Protocol client authentication flow. This approach is deferred for future consideration.

## 9. Future Expansion Opportunities

The analysis of the `tangled.org` API revealed a rich set of features that are not yet part of the initial CLI plan but represent significant opportunities for future expansion. These include:

- **CI/CD Pipelines:** Commands to view pipeline status and manage CI/CD jobs.
- **Repository Secrets:** A dedicated command set for managing CI/CD secrets within a repository (`tangled repo secret ...`).
- **Advanced Git Operations:** Commands to interact with the commit log, diffs, branches, and tags directly via the API, augmenting local `git` commands.
- **Social & Feed Interactions:** Commands for starring repositories, reacting to feed items, and managing the user's social graph (following/unfollowing).
- **Label Management:** Commands to create, apply, and remove labels from issues and pull requests.
- **Collaboration:** Commands to manage repository collaborators.
- **Fork Management:** Commands for forking repositories and managing the sync status of forks.

## 10. Task Management

We're bootstrapping task tracking with TODO.md, but will migrate all tasks into Tangled issues and dog food the product as soon as we have basic issue creation and listing working.

## 11. Development

### Prerequisites

- Node.js 22.0.0 or higher (latest LTS)
- npm (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Available Scripts

- `npm run dev` - Run the CLI in development mode (with hot reload via tsx)
- `npm run build` - Build TypeScript to JavaScript (output to `dist/`)
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code with Biome linter
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Biome
- `npm run typecheck` - Type check without building

### Running Locally

```bash
# Run the CLI in development mode
npm run dev -- --version
npm run dev -- --help

# Build and run the production version
npm run build
node dist/index.js --version

# Install globally for local testing
npm link
tangled --version
tangled --help
npm unlink -g tangled-cli  # Unlink when done
```

### Project Structure

```
tangled-cli/
├── src/
│   ├── index.ts          # Main CLI entry point
│   ├── commands/         # Command implementations
│   ├── lib/              # Core business logic
│   └── utils/            # Helper functions
├── tests/                # Test files
├── dist/                 # Build output (gitignored)
└── package.json          # Package configuration
```

### Technology Stack

- **TypeScript 5.7.2** - Latest stable with strict mode enabled
- **Node.js 22+** - Latest LTS target
- **ES2023** - Latest stable ECMAScript target
- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)
- **Vitest** - Fast unit test framework
- **Commander.js** - CLI framework
- **tsx** - Fast TypeScript execution for development
