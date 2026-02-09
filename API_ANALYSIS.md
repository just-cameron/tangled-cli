# Tangled CLI: API Analysis and Implementation Feasibility

This document details the analysis of the `tangled.org` API, based on the lexicon files found in the `tangled.org/core` repository, and assesses the feasibility of implementing the commands outlined in `TODO.md`.

## API Structure Overview

The `tangled.org` API leverages the AT Protocol (ATProto), combining custom lexicons (schemas) for specific data types with generic ATProto repository operations (`com.atproto.repo.*`) for fundamental record management (create, get, list). This approach is common in ATProto-based services.

## Feasibility of `TODO.md` Commands

All commands currently outlined in `TODO.md` appear to be implementable with the existing API structure.

### Authentication (`tangled auth login`)

*   **Feasible.** This will utilize the standard AT Protocol `com.atproto.server.createSession` procedure. This procedure is part of the core ATProto specification and would be handled by the `@atproto/api` library, not requiring a specific `tangled.org` lexicon.

### Git SSH Key Management

#### Lexicon Details

**`sh.tangled.publicKey` Record Schema** (from `core/lexicons/publicKey.json`):
```json
{
  "lexicon": 1,
  "id": "sh.tangled.publicKey",
  "key": "tid",
  "record": {
    "required": ["key", "name", "createdAt"],
    "properties": {
      "key": {
        "type": "string",
        "maxLength": 4096,
        "description": "public key contents"
      },
      "name": {
        "type": "string",
        "description": "human-readable name for this key"
      },
      "createdAt": {
        "type": "string",
        "format": "datetime",
        "description": "key upload timestamp"
      }
    }
  }
}
```

**`sh.tangled.knot.listKeys` Query** (from `core/lexicons/knot/listKeys.json`):
- Query endpoint for listing public keys stored on the knot server
- Returns: Array of `{ did, key, createdAt }`
- Supports pagination with `limit` and `cursor` parameters

#### Implementation Approach

*   **`tangled ssh-key add <public-key-path>`**:
    *   **Feasible (using generic ATProto record creation).**
    *   Uses `AtpAgent.com.atproto.repo.createRecord()` with:
      - `collection: "sh.tangled.publicKey"`
      - `record: { key, name, createdAt }`
    *   The record will be stored on the user's PDS (Personal Data Server)
    *   The CLI reads the public key file, validates the format, and creates the record

*   **`tangled ssh-key verify`**:
    *   **Feasible.** This command can be implemented by:
        1.  Executing `ssh -T git@tangled.org` to capture the authenticated user's DID from the server response
        2.  Parsing the DID from the SSH output
        3.  Resolving the DID to a human-readable Bluesky handle using `com.atproto.identity.resolveHandle`
    *   Note: The `sh.tangled.knot.listKeys` query is available but may require knot server access

#### TypeScript/JavaScript Tools

- **`@atproto/api`**: Main SDK for AT Protocol operations
  - `AtpAgent` class handles authentication and API calls
  - Built-in methods for `com.atproto.repo.createRecord`, `getRecord`, `listRecords`

- **`@atproto/lexicon`**: Schema validation library
  - `Lexicons` class for loading and validating custom schemas
  - Provides `assertValidRecord()` for validating record data against lexicons

- **Direct Record Creation**: No code generation needed
  ```typescript
  await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'sh.tangled.publicKey',
    record: {
      key: publicKeyContent,
      name: keyName,
      createdAt: new Date().toISOString()
    }
  })
  ```

### Repository Management

*   **`tangled repo create <repo-name>`**:
    *   **Feasible.** The `sh.tangled.repo.create` procedure (defined in `core/lexicons/repo/create.json`) directly supports this. It requires an `rkey` (repository key/name) and can optionally accept a `defaultBranch` and a `source` URL for forking/importing.
*   **`tangled repo view [--json <fields>]`**:
    *   **Feasible (using generic ATProto record retrieval).** The `core/lexicons/repo/repo.json` defines the `sh.tangled.repo` record type. To view details of a specific repository, the CLI would use the generic ATProto `com.atproto.repo.getRecord` procedure, specifying `collection: "sh.tangled.repo"` and the appropriate record key (`rkey`).

### Issue Management

*   **`tangled issue create "<title>" [--body "<body>" | --body-file <file> | -F -]`**:
    *   **Feasible (using generic ATProto record creation).** The `core/lexicons/issue/issue.json` defines the `sh.tangled.repo.issue` record type. To create a new issue, the CLI would use the generic ATProto `com.atproto.repo.createRecord` procedure. The `collection` would be `sh.tangled.repo.issue`, and the `record` data would include the `repo` (AT-URI of the repository), `title`, and `body` (if provided).
*   **`tangled issue list [--json "id,title"]`**:
    *   **Feasible (using generic ATProto record listing).** To list issues for a repository, the CLI would use the generic ATProto `com.atproto.repo.listRecords` procedure, specifying `collection: "sh.tangled.repo.issue"`. Client-side filtering by the `repo` field (which is an AT-URI to the parent repository) might be necessary if the API does not offer server-side filtering for this specific collection.

## API Resources and Actions Missing from Current CLI Plan

The `tangled.org` API, as revealed by its lexicons, exposes numerous capabilities beyond the current scope of the `TODO.md`. These represent potential future enhancements for the CLI:

### Pull Requests

A comprehensive set of lexicons (`pulls/pull.json`, `pulls/open.json`, `pulls/merged.json`, `pulls/comment.json`, `pulls/closed.json`, `pulls/state.json`) indicates a fully-fledged Pull Request system.
*   **Potential CLI Commands:** `tangled pulls list`, `tangled pulls view <id>`, `tangled pulls create`, `tangled pulls merge`, `tangled pulls close`, `tangled pulls comment`.

### CI/CD Pipelines

Lexicons such as `pipeline/pipeline.json`, `pipeline/status.json`, and `pipeline/cancelPipeline.json` suggest integration with a CI/CD system.
*   **Potential CLI Commands:** `tangled pipeline status`, `tangled pipeline cancel <id>`.

### Repository Secrets

The `repo/addSecret.json`, `repo/listSecrets.json`, and `repo/removeSecret.json` lexicons allow for managing CI/CD secrets specific to a repository.
*   **Potential CLI Commands:** `tangled repo secret add <key> <value>`, `tangled repo secret list`, `tangled repo secret remove <key>`.

### Advanced Git Operations

Several lexicons expose finer-grained Git operations directly via XRPC, potentially allowing for more integrated Git functionality beyond simple cloning/pushing:
*   `repo/log.json` (view commit history)
*   `repo/diff.json` (view changes between commits/branches)
*   `repo/branches.json`, `repo/branch.json`, `repo/deleteBranch.json` (manage branches)
*   `repo/tags.json`, `repo/tag.json` (manage tags)
*   `repo/compare.json` (compare two refs)
*   `git/refUpdate.json` (update Git references)
*   **Potential CLI Commands:** `tangled repo log`, `tangled repo diff`, `tangled branch list`, etc.

### Social & Feed Interactions

Lexicons like `graph/follow.json`, `feed/star.json`, and `feed/reaction.json` suggest social networking features common in ATProto applications.
*   **Potential CLI Commands:** `tangled follow <did>`, `tangled star <uri>`, `tangled react <uri>`.

### Labels

The `label/definition.json` and `label/op.json` lexicons provide mechanisms for defining and applying labels to various resources (e.g., issues, pull requests).
*   **Potential CLI Commands:** `tangled label add`, `tangled label list`.

### Repository Collaboration

The `repo/collaborator.json` lexicon suggests managing collaborators on a repository.
*   **Potential CLI Commands:** `tangled repo collaborator add`, `tangled repo collaborator list`.

### Forking and Syncing

`repo/forkSync.json` and `repo/forkStatus.json` point to specific API support for managing repository forks and their synchronization status.
*   **Potential CLI Commands:** `tangled repo fork`, `tangled repo fork-sync`.

## Conclusion

The `tangled.org` API provides a solid foundation for building the planned CLI. All current `TODO.md` items are implementable, primarily by leveraging the `@atproto/api` library's generic record operations in conjunction with `tangled.org`'s custom record definitions and specific procedures. The API also offers a rich set of additional functionalities that can significantly extend the CLI's capabilities in future iterations, particularly around pull requests, CI/CD, and advanced Git management.