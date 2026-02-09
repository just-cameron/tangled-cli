# Tangled CLI: API Analysis and Implementation Feasibility

This document details the analysis of the `tangled.org` API, based on the lexicon files found in the `tangled.org/core` repository, and assesses the feasibility of implementing the commands outlined in `TODO.md`.

## 1. API Structure Overview

The `tangled.org` API leverages the AT Protocol (ATProto), combining custom lexicons (schemas) for specific data types with generic ATProto repository operations (`com.atproto.repo.*`) for fundamental record management (create, get, list). This approach is common in ATProto-based services.

## 2. Feasibility of `TODO.md` Commands

All commands currently outlined in `TODO.md` appear to be implementable with the existing API structure.

### 2.1. Authentication (`tangled auth login`)

*   **Feasible.** This will utilize the standard AT Protocol `com.atproto.server.createSession` procedure. This procedure is part of the core ATProto specification and would be handled by the `@atproto/api` library, not requiring a specific `tangled.org` lexicon.

### 2.2. Git SSH Key Management

*   **`tangled ssh-key add <public-key-path>`**:
    *   **Feasible (using generic ATProto record creation).** The `core/lexicons/publicKey.json` defines the `sh.tangled.publicKey` record type. To add a user's global SSH public key, the CLI would use the generic ATProto `com.atproto.repo.createRecord` procedure. The `collection` parameter would be set to `sh.tangled.publicKey`, and the public key content (`key`) and a human-readable name (`name`) would be provided as the record data.
*   **`tangled ssh-key verify`**:
    *   **Feasible.** This command can be implemented by:
        1.  Executing `ssh -T git@tangled.org` to capture the authenticated user's DID from the server response.
        2.  Using the `sh.tangled.knot.listKeys` query (defined in `core/lexicons/knot/listKeys.json`) to fetch a list of public keys known to the knot server. This query returns objects that include the `did` associated with each key.
        3.  Comparing the DID obtained from the SSH output with the DIDs returned by `listKeys` to confirm the key's association.
        4.  Resolving the DID to a human-readable Bluesky handle using the standard AT Protocol `com.atproto.identity.resolveHandle` procedure (part of `@atproto/api`).

### 2.3. Repository Management

*   **`tangled repo create <repo-name>`**:
    *   **Feasible.** The `sh.tangled.repo.create` procedure (defined in `core/lexicons/repo/create.json`) directly supports this. It requires an `rkey` (repository key/name) and can optionally accept a `defaultBranch` and a `source` URL for forking/importing.
*   **`tangled repo view [--json <fields>]`**:
    *   **Feasible (using generic ATProto record retrieval).** The `core/lexicons/repo/repo.json` defines the `sh.tangled.repo` record type. To view details of a specific repository, the CLI would use the generic ATProto `com.atproto.repo.getRecord` procedure, specifying `collection: "sh.tangled.repo"` and the appropriate record key (`rkey`).

### 2.4. Issue Management

*   **`tangled issue create "<title>" [--body "<body>" | --body-file <file> | -F -]`**:
    *   **Feasible (using generic ATProto record creation).** The `core/lexicons/issue/issue.json` defines the `sh.tangled.repo.issue` record type. To create a new issue, the CLI would use the generic ATProto `com.atproto.repo.createRecord` procedure. The `collection` would be `sh.tangled.repo.issue`, and the `record` data would include the `repo` (AT-URI of the repository), `title`, and `body` (if provided).
*   **`tangled issue list [--json "id,title"]`**:
    *   **Feasible (using generic ATProto record listing).** To list issues for a repository, the CLI would use the generic ATProto `com.atproto.repo.listRecords` procedure, specifying `collection: "sh.tangled.repo.issue"`. Client-side filtering by the `repo` field (which is an AT-URI to the parent repository) might be necessary if the API does not offer server-side filtering for this specific collection.

## 3. API Resources and Actions Missing from Current CLI Plan

The `tangled.org` API, as revealed by its lexicons, exposes numerous capabilities beyond the current scope of the `TODO.md`. These represent potential future enhancements for the CLI:

### 3.1. Pull Requests

A comprehensive set of lexicons (`pulls/pull.json`, `pulls/open.json`, `pulls/merged.json`, `pulls/comment.json`, `pulls/closed.json`, `pulls/state.json`) indicates a fully-fledged Pull Request system.
*   **Potential CLI Commands:** `tangled pulls list`, `tangled pulls view <id>`, `tangled pulls create`, `tangled pulls merge`, `tangled pulls close`, `tangled pulls comment`.

### 3.2. CI/CD Pipelines

Lexicons such as `pipeline/pipeline.json`, `pipeline/status.json`, and `pipeline/cancelPipeline.json` suggest integration with a CI/CD system.
*   **Potential CLI Commands:** `tangled pipeline status`, `tangled pipeline cancel <id>`.

### 3.3. Repository Secrets

The `repo/addSecret.json`, `repo/listSecrets.json`, and `repo/removeSecret.json` lexicons allow for managing CI/CD secrets specific to a repository.
*   **Potential CLI Commands:** `tangled repo secret add <key> <value>`, `tangled repo secret list`, `tangled repo secret remove <key>`.

### 3.4. Advanced Git Operations

Several lexicons expose finer-grained Git operations directly via XRPC, potentially allowing for more integrated Git functionality beyond simple cloning/pushing:
*   `repo/log.json` (view commit history)
*   `repo/diff.json` (view changes between commits/branches)
*   `repo/branches.json`, `repo/branch.json`, `repo/deleteBranch.json` (manage branches)
*   `repo/tags.json`, `repo/tag.json` (manage tags)
*   `repo/compare.json` (compare two refs)
*   `git/refUpdate.json` (update Git references)
*   **Potential CLI Commands:** `tangled repo log`, `tangled repo diff`, `tangled branch list`, etc.

### 3.5. Social & Feed Interactions

Lexicons like `graph/follow.json`, `feed/star.json`, and `feed/reaction.json` suggest social networking features common in ATProto applications.
*   **Potential CLI Commands:** `tangled follow <did>`, `tangled star <uri>`, `tangled react <uri>`.

### 3.6. Labels

The `label/definition.json` and `label/op.json` lexicons provide mechanisms for defining and applying labels to various resources (e.g., issues, pull requests).
*   **Potential CLI Commands:** `tangled label add`, `tangled label list`.

### 3.7. Repository Collaboration

The `repo/collaborator.json` lexicon suggests managing collaborators on a repository.
*   **Potential CLI Commands:** `tangled repo collaborator add`, `tangled repo collaborator list`.

### 3.8. Forking and Syncing

`repo/forkSync.json` and `repo/forkStatus.json` point to specific API support for managing repository forks and their synchronization status.
*   **Potential CLI Commands:** `tangled repo fork`, `tangled repo fork-sync`.

## 4. Conclusion

The `tangled.org` API provides a solid foundation for building the planned CLI. All current `TODO.md` items are implementable, primarily by leveraging the `@atproto/api` library's generic record operations in conjunction with `tangled.org`'s custom record definitions and specific procedures. The API also offers a rich set of additional functionalities that can significantly extend the CLI's capabilities in future iterations, particularly around pull requests, CI/CD, and advanced Git management.