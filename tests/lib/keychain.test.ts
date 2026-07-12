import { describe, expect, it, vi } from 'vitest';
import { createMacOsKeychainStore } from '../../src/lib/keychain.js';

describe('macOS Keychain store', () => {
  it('creates credentials through the stable security helper without putting secrets in argv', async () => {
    const run = vi.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' });
    const store = createMacOsKeychainStore(run);

    await store.setPassword('tangled-cli-oauth-session', 'did:plc:test', 'secret-value');

    expect(run).toHaveBeenCalledOnce();
    const [args, input] = run.mock.calls[0];
    expect(args).toEqual([
      'add-generic-password',
      '-a',
      'did:plc:test',
      '-s',
      'tangled-cli-oauth-session',
      '-T',
      '/usr/bin/security',
      '-w',
    ]);
    expect(args).not.toContain('secret-value');
    expect(input).toBe('secret-value\nsecret-value\n');
  });

  it('updates existing credentials without replacing their stable access list', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 45, stdout: '', stderr: 'item already exists' })
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' });
    const store = createMacOsKeychainStore(run);

    await store.setPassword('service', 'account', 'updated-secret');

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1][0]).toEqual([
      'add-generic-password',
      '-U',
      '-a',
      'account',
      '-s',
      'service',
      '-w',
    ]);
    expect(run.mock.calls[1][0]).not.toContain('-T');
    expect(run.mock.calls[1][1]).toBe('updated-secret\nupdated-secret\n');
  });

  it('reads a credential and removes the security command newline', async () => {
    const run = vi.fn().mockResolvedValue({ code: 0, stdout: 'stored-secret\n', stderr: '' });
    const store = createMacOsKeychainStore(run);

    await expect(store.getPassword('service', 'account')).resolves.toBe('stored-secret');
    expect(run).toHaveBeenCalledWith([
      'find-generic-password',
      '-a',
      'account',
      '-s',
      'service',
      '-w',
    ]);
  });

  it('returns null when a credential does not exist', async () => {
    const run = vi.fn().mockResolvedValue({ code: 44, stdout: '', stderr: 'not found' });
    const store = createMacOsKeychainStore(run);

    await expect(store.getPassword('service', 'account')).resolves.toBeNull();
  });

  it('reports whether a credential was deleted', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' })
      .mockResolvedValueOnce({ code: 44, stdout: '', stderr: 'not found' });
    const store = createMacOsKeychainStore(run);

    await expect(store.deletePassword('service', 'account')).resolves.toBe(true);
    await expect(store.deletePassword('service', 'account')).resolves.toBe(false);
  });

  it('surfaces Keychain command failures without exposing the secret', async () => {
    const run = vi.fn().mockResolvedValue({ code: 1, stdout: '', stderr: 'keychain locked' });
    const store = createMacOsKeychainStore(run);

    await expect(store.setPassword('service', 'account', 'do-not-print')).rejects.toThrow(
      'macOS Keychain write failed: keychain locked'
    );
  });
});
