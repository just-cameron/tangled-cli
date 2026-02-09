import { describe, expect, it } from 'vitest';
import { isTangledRemote, parseTangledRemote } from '../../src/utils/git.js';

describe('Git Utilities', () => {
  describe('isTangledRemote', () => {
    it('should detect SSH tangled remotes', () => {
      expect(isTangledRemote('git@tangled.org:did:plc:abc123/repo.git')).toBe(true);
      expect(isTangledRemote('ssh://git@tangled.org/did:plc:abc123/repo.git')).toBe(true);
    });

    it('should detect HTTPS tangled remotes', () => {
      expect(isTangledRemote('https://tangled.org/markbennett.ca/tangled-cli')).toBe(true);
      expect(isTangledRemote('https://tangled.org/user.bsky.social/repo')).toBe(true);
    });

    it('should reject non-tangled remotes', () => {
      expect(isTangledRemote('git@github.com:user/repo.git')).toBe(false);
      expect(isTangledRemote('https://github.com/user/repo')).toBe(false);
      expect(isTangledRemote('https://gitlab.com/user/repo')).toBe(false);
      expect(isTangledRemote('')).toBe(false);
    });
  });

  describe('parseTangledRemote', () => {
    describe('SSH URLs with DIDs', () => {
      it('should parse git@tangled.org:did:plc:xxx/repo.git format', () => {
        const result = parseTangledRemote(
          'git@tangled.org:did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git'
        );
        expect(result).toEqual({
          owner: 'did:plc:b2mcbcamkwyznc5fkplwlxbf',
          ownerType: 'did',
          name: 'tangled-cli',
          protocol: 'ssh',
        });
      });

      it('should parse ssh://git@tangled.org/did:plc:xxx/repo.git format', () => {
        const result = parseTangledRemote(
          'ssh://git@tangled.org/did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git'
        );
        expect(result).toEqual({
          owner: 'did:plc:b2mcbcamkwyznc5fkplwlxbf',
          ownerType: 'did',
          name: 'tangled-cli',
          protocol: 'ssh',
        });
      });

      it('should handle SSH URLs without .git extension', () => {
        const result = parseTangledRemote('git@tangled.org:did:plc:abc123/repo');
        expect(result).toEqual({
          owner: 'did:plc:abc123',
          ownerType: 'did',
          name: 'repo',
          protocol: 'ssh',
        });
      });
    });

    describe('SSH URLs with handles', () => {
      it('should parse SSH URL with handle instead of DID', () => {
        const result = parseTangledRemote('git@tangled.org:markbennett.ca/tangled-cli.git');
        expect(result).toEqual({
          owner: 'markbennett.ca',
          ownerType: 'handle',
          name: 'tangled-cli',
          protocol: 'ssh',
        });
      });
    });

    describe('HTTPS URLs with handles', () => {
      it('should parse https://tangled.org/handle/repo format', () => {
        const result = parseTangledRemote('https://tangled.org/markbennett.ca/tangled-cli');
        expect(result).toEqual({
          owner: 'markbennett.ca',
          ownerType: 'handle',
          name: 'tangled-cli',
          protocol: 'https',
        });
      });

      it('should parse HTTPS with user.bsky.social handle', () => {
        const result = parseTangledRemote('https://tangled.org/user.bsky.social/repo');
        expect(result).toEqual({
          owner: 'user.bsky.social',
          ownerType: 'handle',
          name: 'repo',
          protocol: 'https',
        });
      });

      it('should handle HTTPS URLs without .git extension', () => {
        const result = parseTangledRemote('https://tangled.org/markbennett.ca/repo');
        expect(result?.name).toBe('repo');
      });
    });

    describe('HTTPS URLs with DIDs', () => {
      it('should parse HTTPS URL with DID instead of handle', () => {
        const result = parseTangledRemote(
          'https://tangled.org/did:plc:b2mcbcamkwyznc5fkplwlxbf/repo'
        );
        expect(result).toEqual({
          owner: 'did:plc:b2mcbcamkwyznc5fkplwlxbf',
          ownerType: 'did',
          name: 'repo',
          protocol: 'https',
        });
      });
    });

    describe('edge cases', () => {
      it('should handle trailing slashes', () => {
        const result = parseTangledRemote('https://tangled.org/markbennett.ca/repo/');
        expect(result?.name).toBe('repo');
      });

      it('should handle .git extension in various positions', () => {
        const result1 = parseTangledRemote('git@tangled.org:did:plc:abc123/repo.git');
        const result2 = parseTangledRemote('https://tangled.org/markbennett.ca/repo.git');
        expect(result1?.name).toBe('repo');
        expect(result2?.name).toBe('repo');
      });

      it('should return null for invalid DID format', () => {
        const result = parseTangledRemote('git@tangled.org:did:plc:INVALID/repo.git');
        expect(result).toBeNull();
      });

      it('should return null for invalid handle format', () => {
        const result = parseTangledRemote('https://tangled.org/invalid/repo');
        expect(result).toBeNull();
      });

      it('should return null for missing repo name', () => {
        const result = parseTangledRemote('git@tangled.org:did:plc:abc123');
        expect(result).toBeNull();
      });

      it('should return null for non-tangled URLs', () => {
        expect(parseTangledRemote('git@github.com:user/repo.git')).toBeNull();
        expect(parseTangledRemote('https://github.com/user/repo')).toBeNull();
      });
    });
  });
});
