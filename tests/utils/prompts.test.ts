import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promptForIdentifier, promptForLogin, promptForPassword } from '../../src/utils/prompts.js';

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  password: vi.fn(),
}));

describe('Prompts', () => {
  let mockInput: ReturnType<typeof vi.fn>;
  let mockPassword: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const inquirer = await import('@inquirer/prompts');
    mockInput = vi.mocked(inquirer.input);
    mockPassword = vi.mocked(inquirer.password);
    vi.clearAllMocks();
  });

  describe('promptForIdentifier', () => {
    it('should prompt for identifier and return valid handle', async () => {
      mockInput.mockResolvedValue('user.bsky.social');

      const result = await promptForIdentifier();

      expect(result).toBe('user.bsky.social');
      expect(mockInput).toHaveBeenCalledWith({
        message: 'Enter your AT Protocol identifier (handle or DID):',
        validate: expect.any(Function),
      });
    });

    it('should validate identifier format', async () => {
      mockInput.mockResolvedValue('user.bsky.social');

      await promptForIdentifier();

      const validateFn = mockInput.mock.calls[0]?.[0]?.validate;
      expect(validateFn).toBeDefined();

      if (validateFn) {
        // Valid handle
        expect(validateFn('user.bsky.social')).toBe(true);

        // Valid DID
        expect(validateFn('did:plc:test123')).toBe(true);

        // Empty
        expect(validateFn('')).toBe('Identifier cannot be empty');
        expect(validateFn('   ')).toBe('Identifier cannot be empty');

        // Invalid format
        expect(validateFn('invalid')).toContain('Invalid');
      }
    });
  });

  describe('promptForPassword', () => {
    it('should prompt for password with masking', async () => {
      mockPassword.mockResolvedValue('test-password');

      const result = await promptForPassword();

      expect(result).toBe('test-password');
      expect(mockPassword).toHaveBeenCalledWith({
        message: 'Enter your app password:',
        mask: '*',
        validate: expect.any(Function),
      });
    });

    it('should validate password is not empty', async () => {
      mockPassword.mockResolvedValue('test-password');

      await promptForPassword();

      const validateFn = mockPassword.mock.calls[0]?.[0]?.validate;
      expect(validateFn).toBeDefined();

      if (validateFn) {
        // Valid password
        expect(validateFn('password123')).toBe(true);

        // Empty
        expect(validateFn('')).toBe('Password cannot be empty');
      }
    });
  });

  describe('promptForLogin', () => {
    it('should prompt for both identifier and password', async () => {
      mockInput.mockResolvedValue('user.bsky.social');
      mockPassword.mockResolvedValue('test-password');

      const result = await promptForLogin();

      expect(result).toEqual({
        identifier: 'user.bsky.social',
        password: 'test-password',
      });
      expect(mockInput).toHaveBeenCalledOnce();
      expect(mockPassword).toHaveBeenCalledOnce();
    });
  });
});
