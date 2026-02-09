import { describe, expect, it } from 'vitest';
import {
  isValidAtUri,
  isValidHandle,
  isValidTangledDid,
  safeValidateDid,
  safeValidateHandle,
  safeValidateIdentifier,
  validateAppPassword,
  validateDid,
  validateHandle,
  validateIdentifier,
  validateIssueBody,
  validateIssueTitle,
} from '../../src/utils/validation.js';

describe('Handle Validation', () => {
  describe('validateHandle', () => {
    it('should accept standard Bluesky handles', () => {
      expect(validateHandle('user.bsky.social')).toBe('user.bsky.social');
      expect(validateHandle('test.bsky.social')).toBe('test.bsky.social');
    });

    it('should accept custom domain handles', () => {
      expect(validateHandle('markbennett.ca')).toBe('markbennett.ca');
      expect(validateHandle('example.com')).toBe('example.com');
      expect(validateHandle('subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should reject invalid handles', () => {
      expect(() => validateHandle('')).toThrow('Handle cannot be empty');
      expect(() => validateHandle('invalid')).toThrow('Invalid handle format');
      expect(() => validateHandle('invalid..com')).toThrow('Invalid handle format');
      expect(() => validateHandle('.example.com')).toThrow('Invalid handle format');
      expect(() => validateHandle('example.com.')).toThrow('Invalid handle format');
    });
  });

  describe('safeValidateHandle', () => {
    it('should return success for valid handles', () => {
      const result = safeValidateHandle('user.bsky.social');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user.bsky.social');
      }
    });

    it('should return error for invalid handles', () => {
      const result = safeValidateHandle('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid handle format');
      }
    });
  });
});

describe('DID Validation', () => {
  describe('validateDid', () => {
    it('should accept valid DIDs', () => {
      expect(validateDid('did:plc:test123')).toBe('did:plc:test123');
      expect(validateDid('did:web:example.com')).toBe('did:web:example.com');
      expect(validateDid('did:key:z6MkhaXg')).toBe('did:key:z6MkhaXg');
    });

    it('should reject invalid DIDs', () => {
      expect(() => validateDid('')).toThrow('DID cannot be empty');
      expect(() => validateDid('not-a-did')).toThrow('Invalid DID format');
      expect(() => validateDid('did:')).toThrow('Invalid DID format');
      expect(() => validateDid('did:plc:')).toThrow('Invalid DID format');
    });
  });

  describe('safeValidateDid', () => {
    it('should return success for valid DIDs', () => {
      const result = safeValidateDid('did:plc:test123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('did:plc:test123');
      }
    });

    it('should return error for invalid DIDs', () => {
      const result = safeValidateDid('not-a-did');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid DID format');
      }
    });
  });
});

describe('Identifier Validation', () => {
  describe('validateIdentifier', () => {
    it('should accept valid handles', () => {
      expect(validateIdentifier('user.bsky.social')).toBe('user.bsky.social');
      expect(validateIdentifier('example.com')).toBe('example.com');
    });

    it('should accept valid DIDs', () => {
      expect(validateIdentifier('did:plc:test123')).toBe('did:plc:test123');
      expect(validateIdentifier('did:web:example.com')).toBe('did:web:example.com');
    });

    it('should reject invalid identifiers', () => {
      expect(() => validateIdentifier('')).toThrow();
      expect(() => validateIdentifier('invalid')).toThrow();
    });
  });

  describe('safeValidateIdentifier', () => {
    it('should return success for valid identifiers', () => {
      expect(safeValidateIdentifier('user.bsky.social').success).toBe(true);
      expect(safeValidateIdentifier('did:plc:test123').success).toBe(true);
    });

    it('should return error for invalid identifiers', () => {
      const result = safeValidateIdentifier('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });
  });
});

describe('App Password Validation', () => {
  describe('validateAppPassword', () => {
    it('should accept valid passwords', () => {
      expect(validateAppPassword('password123')).toBe('password123');
      expect(validateAppPassword('xxxx-xxxx-xxxx-xxxx')).toBe('xxxx-xxxx-xxxx-xxxx');
      expect(validateAppPassword('a'.repeat(100))).toBe('a'.repeat(100));
    });

    it('should reject empty passwords', () => {
      expect(() => validateAppPassword('')).toThrow('Password cannot be empty');
    });

    it('should reject extremely long passwords', () => {
      expect(() => validateAppPassword('a'.repeat(1001))).toThrow('Password is too long');
    });
  });
});

describe('Boolean Validation Helpers', () => {
  describe('isValidHandle', () => {
    it('should return true for valid handles', () => {
      expect(isValidHandle('user.bsky.social')).toBe(true);
      expect(isValidHandle('markbennett.ca')).toBe(true);
      expect(isValidHandle('sub.domain.example.com')).toBe(true);
    });

    it('should return false for invalid handles', () => {
      expect(isValidHandle('invalid')).toBe(false);
      expect(isValidHandle('.starts-with-dot.com')).toBe(false);
      expect(isValidHandle('ends-with-dot.com.')).toBe(false);
      expect(isValidHandle('has space.com')).toBe(false);
      expect(isValidHandle('')).toBe(false);
    });
  });

  describe('isValidTangledDid', () => {
    it('should return true for valid Tangled DIDs (did:plc: format)', () => {
      expect(isValidTangledDid('did:plc:b2mcbcamkwyznc5fkplwlxbf')).toBe(true);
      expect(isValidTangledDid('did:plc:abc123xyz')).toBe(true);
    });

    it('should return false for invalid Tangled DIDs', () => {
      expect(isValidTangledDid('did:plc:')).toBe(false);
      expect(isValidTangledDid('did:plc:ABC123')).toBe(false); // uppercase not allowed
      expect(isValidTangledDid('did:web:example.com')).toBe(false); // wrong method
      expect(isValidTangledDid('not-a-did')).toBe(false);
      expect(isValidTangledDid('')).toBe(false);
    });
  });
});

describe('Issue Validation', () => {
  describe('validateIssueTitle', () => {
    it('should accept valid issue titles', () => {
      expect(validateIssueTitle('Bug: Fix login error')).toBe('Bug: Fix login error');
      expect(validateIssueTitle('Feature: Add dark mode')).toBe('Feature: Add dark mode');
      expect(validateIssueTitle('A')).toBe('A'); // minimum length
    });

    it('should accept titles up to 256 characters', () => {
      const longTitle = 'A'.repeat(256);
      expect(validateIssueTitle(longTitle)).toBe(longTitle);
    });

    it('should reject empty titles', () => {
      expect(() => validateIssueTitle('')).toThrow('Issue title cannot be empty');
    });

    it('should reject titles over 256 characters', () => {
      const tooLong = 'A'.repeat(257);
      expect(() => validateIssueTitle(tooLong)).toThrow('Issue title must be 256 characters or less');
    });
  });

  describe('validateIssueBody', () => {
    it('should accept valid issue bodies', () => {
      expect(validateIssueBody('This is a description')).toBe('This is a description');
      expect(validateIssueBody('Multi\nline\ndescription')).toBe('Multi\nline\ndescription');
    });

    it('should accept bodies up to 50,000 characters', () => {
      const longBody = 'A'.repeat(50000);
      expect(validateIssueBody(longBody)).toBe(longBody);
    });

    it('should accept empty string', () => {
      expect(validateIssueBody('')).toBe('');
    });

    it('should reject bodies over 50,000 characters', () => {
      const tooLong = 'A'.repeat(50001);
      expect(() => validateIssueBody(tooLong)).toThrow('Issue body must be 50,000 characters or less');
    });
  });
});

describe('AT-URI Validation', () => {
  describe('isValidAtUri', () => {
    it('should return true for valid AT-URIs', () => {
      expect(isValidAtUri('at://did:plc:abc123/sh.tangled.repo/my-repo')).toBe(true);
      expect(isValidAtUri('at://did:plc:abc123/sh.tangled.repo.issue/xyz789')).toBe(true);
      expect(isValidAtUri('at://did:web:example.com/collection')).toBe(true);
    });

    it('should return true for AT-URIs without rkey', () => {
      expect(isValidAtUri('at://did:plc:abc123/collection')).toBe(true);
    });

    it('should return false for invalid AT-URIs', () => {
      expect(isValidAtUri('http://example.com')).toBe(false);
      expect(isValidAtUri('at://not-a-did/collection')).toBe(false);
      expect(isValidAtUri('at://did:plc:abc/invalid collection')).toBe(false);
      expect(isValidAtUri('')).toBe(false);
    });
  });
});
