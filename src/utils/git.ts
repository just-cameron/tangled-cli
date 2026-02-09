/**
 * Git utilities for parsing and validating tangled.org remote URLs
 */

import { isValidHandle, isValidTangledDid } from './validation.js';

export interface ParsedTangledRemote {
  owner: string;
  ownerType: 'did' | 'handle';
  name: string;
  protocol: 'ssh' | 'https';
}

/**
 * Check if a Git remote URL is a tangled.org URL
 * @param url - Git remote URL
 * @returns true if URL points to tangled.org
 */
export function isTangledRemote(url: string): boolean {
  // Match tangled.org in SSH or HTTPS URLs
  return (
    url.includes('tangled.org') &&
    (url.startsWith('git@tangled.org:') ||
      url.startsWith('ssh://git@tangled.org') ||
      url.startsWith('https://tangled.org'))
  );
}

/**
 * Parse a tangled.org Git remote URL to extract owner and repo name
 * @param url - Git remote URL
 * @returns Parsed remote info or null if not a valid tangled URL
 */
export function parseTangledRemote(url: string): ParsedTangledRemote | null {
  if (!isTangledRemote(url)) {
    return null;
  }

  let path: string;
  let protocol: 'ssh' | 'https';

  // Parse based on protocol
  if (url.startsWith('https://tangled.org')) {
    // HTTPS: https://tangled.org/owner/repo
    protocol = 'https';
    path = url.replace(/^https:\/\/tangled\.org\//, '');
  } else if (url.startsWith('ssh://git@tangled.org')) {
    // SSH with ssh:// prefix: ssh://git@tangled.org/owner/repo.git
    protocol = 'ssh';
    path = url.replace(/^ssh:\/\/git@tangled\.org\//, '');
  } else if (url.startsWith('git@tangled.org:')) {
    // SSH shorthand: git@tangled.org:owner/repo.git
    protocol = 'ssh';
    path = url.replace(/^git@tangled\.org:/, '');
  } else {
    return null;
  }

  // Remove trailing slashes
  path = path.replace(/\/+$/, '');

  // Remove .git extension if present
  path = path.replace(/\.git$/, '');

  // Split path into owner and repo name
  const parts = path.split('/');
  if (parts.length < 2) {
    return null;
  }

  const owner = parts[0];
  const name = parts[1];

  // Validate that we have both parts
  if (!owner || !name) {
    return null;
  }

  // Determine owner type based on format
  let ownerType: 'did' | 'handle';
  if (owner.startsWith('did:plc:')) {
    ownerType = 'did';
    // Validate DID format
    if (!isValidTangledDid(owner)) {
      return null;
    }
  } else {
    ownerType = 'handle';
    // Validate handle format
    if (!isValidHandle(owner)) {
      return null;
    }
  }

  return {
    owner,
    ownerType,
    name,
    protocol,
  };
}
