import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  promptForIdentifier,
  promptForLogin,
  promptForPassword,
  promptForRemoteSelection,
  promptToSaveRemote,
} from '../../src/utils/prompts.js';

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
  input: vi.fn(),
  password: vi.fn(),
  select: vi.fn(),
}));

describe('Prompts', () => {
  let mockInput: ReturnType<typeof vi.fn>;
  let mockPassword: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockConfirm: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const inquirer = await import('@inquirer/prompts');
    mockInput = vi.mocked(inquirer.input);
    mockPassword = vi.mocked(inquirer.password);
    mockSelect = vi.mocked(inquirer.select);
    mockConfirm = vi.mocked(inquirer.confirm);
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

  describe('promptForRemoteSelection', () => {
    it('should prompt user to select from multiple remotes', async () => {
      const remotes = [
        { name: 'origin', url: 'git@tangled.org:did:plc:abc123/repo.git' },
        { name: 'upstream', url: 'git@tangled.org:did:plc:xyz789/repo.git' },
      ];

      mockSelect.mockResolvedValue('upstream');

      const result = await promptForRemoteSelection(remotes);

      expect(result).toBe('upstream');
      expect(mockSelect).toHaveBeenCalledWith({
        message: 'Multiple tangled.org remotes found. Which one would you like to use?',
        choices: [
          { name: 'origin (git@tangled.org:did:plc:abc123/repo.git)', value: 'origin' },
          { name: 'upstream (git@tangled.org:did:plc:xyz789/repo.git)', value: 'upstream' },
        ],
        default: 'origin',
      });
    });

    it('should default to "origin" if present', async () => {
      const remotes = [
        { name: 'upstream', url: 'git@tangled.org:did:plc:abc123/repo.git' },
        { name: 'origin', url: 'git@tangled.org:did:plc:xyz789/repo.git' },
      ];

      mockSelect.mockResolvedValue('origin');

      await promptForRemoteSelection(remotes);

      const call = mockSelect.mock.calls[0]?.[0];
      expect(call?.default).toBe('origin');
    });

    it('should not have default if "origin" not present', async () => {
      const remotes = [
        { name: 'upstream', url: 'git@tangled.org:did:plc:abc123/repo.git' },
        { name: 'fork', url: 'git@tangled.org:did:plc:xyz789/repo.git' },
      ];

      mockSelect.mockResolvedValue('upstream');

      await promptForRemoteSelection(remotes);

      const call = mockSelect.mock.calls[0]?.[0];
      expect(call?.default).toBeUndefined();
    });
  });

  describe('promptToSaveRemote', () => {
    it('should prompt user to save remote selection', async () => {
      mockConfirm.mockResolvedValue(true);

      const result = await promptToSaveRemote();

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith({
        message: 'Save this remote selection for this repository? (saves to .tangledrc)',
        default: false,
      });
    });

    it('should default to false', async () => {
      mockConfirm.mockResolvedValue(false);

      const result = await promptToSaveRemote();

      expect(result).toBe(false);
      const call = mockConfirm.mock.calls[0]?.[0];
      expect(call?.default).toBe(false);
    });
  });
});
