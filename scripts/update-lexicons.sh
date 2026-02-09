#!/usr/bin/env bash
set -euo pipefail

# Base URL for tangled.org core repository
BASE_URL="https://tangled.org/tangled.org/core/raw/master/lexicons"

# Create lexicons directory
mkdir -p lexicons/sh/tangled

# Function to download a lexicon file
download_lexicon() {
  local path="$1"
  local dest="lexicons/sh/tangled/$path"
  local url="$BASE_URL/$path"

  echo "Downloading $path..."
  mkdir -p "$(dirname "$dest")"
  curl -fsSL "$url" -o "$dest"
}

# Download all Tangled lexicons
echo "Fetching latest lexicons from tangled.org..."

# Issue lexicons
download_lexicon "issue/issue.json"
download_lexicon "issue/comment.json"
download_lexicon "issue/state.json"
download_lexicon "issue/open.json"
download_lexicon "issue/closed.json"

# Pull request lexicons
download_lexicon "pulls/pull.json"
download_lexicon "pulls/comment.json"
download_lexicon "pulls/state.json"
download_lexicon "pulls/open.json"
download_lexicon "pulls/closed.json"
download_lexicon "pulls/merged.json"

# Repository lexicons
download_lexicon "repo/repo.json"
download_lexicon "repo/create.json"
download_lexicon "repo/delete.json"
download_lexicon "repo/archive.json"
download_lexicon "repo/collaborator.json"
download_lexicon "repo/blob.json"
download_lexicon "repo/tree.json"
download_lexicon "repo/log.json"
download_lexicon "repo/diff.json"
download_lexicon "repo/branch.json"
download_lexicon "repo/branches.json"
download_lexicon "repo/defaultBranch.json"
download_lexicon "repo/getDefaultBranch.json"
download_lexicon "repo/deleteBranch.json"
download_lexicon "repo/tag.json"
download_lexicon "repo/tags.json"
download_lexicon "repo/compare.json"
download_lexicon "repo/merge.json"
download_lexicon "repo/mergeCheck.json"
download_lexicon "repo/forkStatus.json"
download_lexicon "repo/forkSync.json"
download_lexicon "repo/artifact.json"
download_lexicon "repo/hiddenRef.json"
download_lexicon "repo/languages.json"
download_lexicon "repo/addSecret.json"
download_lexicon "repo/listSecrets.json"
download_lexicon "repo/removeSecret.json"

# Label lexicons
download_lexicon "label/definition.json"
download_lexicon "label/op.json"

# Pipeline lexicons
download_lexicon "pipeline/pipeline.json"
download_lexicon "pipeline/status.json"
download_lexicon "pipeline/cancelPipeline.json"

# Top-level lexicons
download_lexicon "owner.json"
download_lexicon "publicKey.json"

# Actor lexicons
download_lexicon "actor/profile.json"

# Feed lexicons
download_lexicon "feed/reaction.json"
download_lexicon "feed/star.json"

# Graph lexicons
download_lexicon "graph/follow.json"

# Git lexicons
download_lexicon "git/refUpdate.json"

# Knot lexicons
download_lexicon "knot/knot.json"
download_lexicon "knot/listKeys.json"
download_lexicon "knot/member.json"
download_lexicon "knot/version.json"

# Spindle lexicons
download_lexicon "spindle/spindle.json"
download_lexicon "spindle/member.json"

# String lexicons
download_lexicon "string/string.json"

echo ""
echo "✓ Lexicons downloaded successfully"
echo "  Run 'npm run codegen' to regenerate TypeScript types"
