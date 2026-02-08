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

| Component         | Library               | Purpose                                                      |
| :---------------- | :-------------------- | :----------------------------------------------------------- |
| **Framework**     | **commander**         | Routing (tangled repo create).                               |
| **API Client**    | **@atproto/api**      | Official XRPC client & session management.                   |
| **Git Context**   | **git-url-parse**     | **New:** Parses remote URLs to extract the Tangled DID/NSID. |
| **Git Ops**       | **simple-git**        | Wraps local git operations safely.                           |
| **Validation**    | **zod**               | Validates inputs & generates schemas for LLMs.               |
| **Interactivity** | **@inquirer/prompts** | Modern prompts for humans.                                   |
| **Formatting**    | **cli-table3**        | **New:** For gh-style pretty tables in Human Mode.           |

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

### Summary of Improvements

- **Context Inference:** This is the "killer feature" of gh that we are copying. It makes the tool usable for humans and safer for LLMs (less typing \= fewer errors).
- **Filtered JSON:** Saves tokens for LLM context windows.
- **Git Config Integration:** Treats the local .git folder as a database of configuration, reducing the need for environment variables or complex flags.

## 6. Examples Tangled CLI Usage

```bash
tangled auth login (opens a browser for auth)
tangled repo create my-new-repo
cd my-new-repo
tangled issue create "Bug: Something is broken"
tangled issue list --json "id,title"
```

## 7. Task Management

We're bootstrapping task tracking with TODO.md, but will migrate all tasks into Tangled issues and dog food the product as soon as we have basic issue creation and listing working.

## 8. Outstanding Issues

1. Can we allow auth through the web browser, rather than just CLI username/password? This would be more secure and user-friendly.
2. The GitHub CLI manages the private keys allowing you to authenticate git operations. Can we do something similar, or will users have to manage SSH keys separately? Currently, I store my SSH keys in 1Password which signs requests for me. It would be great if tangled CLI could detect this and use it seamlessly, itentifying the user by the signed ssh key.
3. How should we handle storing the AT Proto session securely? The GitHub CLI uses the OS keychain. We could do something similar. How does this work across different platforms (Windows, macOS, Linux)? We want to avoid storing sensitive tokens in plaintext files.
4. How are settings resolved (e.g. local config file, home folder, command-line flags)? We should define a clear precedence order.
