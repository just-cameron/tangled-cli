import { describe, expect, it } from 'vitest';
import {
  safeValidateDid,
  safeValidateHandle,
  safeValidateIdentifier,
  validateAppPassword,
  validateDid,
  validateHandle,
  validateIdentifier,
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
