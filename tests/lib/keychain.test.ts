import { describe, expect, it, vi } from 'vitest';
import { InvalidCredentialDataError } from '../../src/lib/errors.js';
import {
  createMacOsKeychainStore,
  createMacOsSecurityPasswordInvocation,
} from '../../src/lib/keychain.js';

describe('macOS Keychain store', () => {
  it('creates credentials through the stable security helper without putting secrets in argv', async () => {
    const run = vi.fn().mockResolvedValue({ code: 44, stdout: '', stderr: 'not found' });
    const writePassword = vi.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' });
    const store = createMacOsKeychainStore(run, writePassword);

    await store.setPassword('tangled-cli-oauth-session', 'did:plc:test', 'secret-value');

    expect(run).toHaveBeenCalledOnce();
    expect(writePassword).toHaveBeenCalledOnce();
    const [args, password] = writePassword.mock.calls[0];
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
    expect(password).toBe('tangled-cli-keychain-v1:c2VjcmV0LXZhbHVl');
  });

  it('isolates password bytes from both process arguments and the Expect program', () => {
    const secret = 'safe-ascii-$[]';
    const securityArgs = ['add-generic-password', '-a', 'account', '-s', 'service', '-w'];

    const invocation = createMacOsSecurityPasswordInvocation(securityArgs, secret);

    expect(invocation.executable).toBe('/usr/bin/expect');
    expect(invocation.args).toEqual(['-N', '-n', '-f', '/dev/fd/3', '--', ...securityArgs]);
    expect(invocation.args.join(' ')).not.toContain(secret);
    expect(invocation.scriptInput).not.toContain(secret);
    expect(invocation.passwordInput).toBe(`${Buffer.from(secret, 'utf8').toString('hex')}\n`);
  });

  it('round-trips Unicode and line breaks through an ASCII storage envelope', async () => {
    const secret = 'line one\nline two $[] é ✓';
    let storedPassword = '';
    let hasStoredPassword = false;
    const writePassword = vi.fn().mockImplementation(async (_args, password) => {
      storedPassword = password;
      hasStoredPassword = true;
      return { code: 0, stdout: '', stderr: '' };
    });
    const run = vi
      .fn()
      .mockImplementation(async () =>
        hasStoredPassword
          ? { code: 0, stdout: `${storedPassword}\n`, stderr: '' }
          : { code: 44, stdout: '', stderr: 'not found' }
      );
    const store = createMacOsKeychainStore(run, writePassword);

    await store.setPassword('service', 'account', secret);

    expect(storedPassword).toMatch(/^tangled-cli-keychain-v1:[A-Za-z0-9_-]+$/);
    expect(storedPassword).not.toContain(secret);
    await expect(store.getPassword('service', 'account')).resolves.toBe(secret);
  });

  it('splits long credentials into bounded Keychain items and cleans them up', async () => {
    const secret = `${'long Unicode credential é ✓\n'.repeat(80)}done`;
    const items = new Map<string, string>();
    const itemKey = (args: string[]) => {
      const account = args[args.indexOf('-a') + 1];
      const service = args[args.indexOf('-s') + 1];
      return `${service}\0${account}`;
    };
    const run = vi.fn().mockImplementation(async (args: string[]) => {
      const key = itemKey(args);
      if (args[0] === 'find-generic-password') {
        const value = items.get(key);
        return value === undefined
          ? { code: 44, stdout: '', stderr: 'not found' }
          : { code: 0, stdout: `${value}\n`, stderr: '' };
      }
      if (args[0] === 'delete-generic-password') {
        return items.delete(key)
          ? { code: 0, stdout: '', stderr: '' }
          : { code: 44, stdout: '', stderr: 'not found' };
      }
      throw new Error(`Unexpected security operation: ${args[0]}`);
    });
    const writePassword = vi.fn().mockImplementation(async (args: string[], password: string) => {
      const key = itemKey(args);
      if (items.has(key) && !args.includes('-U')) {
        return { code: 45, stdout: '', stderr: 'item already exists' };
      }
      items.set(key, password);
      return { code: 0, stdout: '', stderr: '' };
    });
    const store = createMacOsKeychainStore(run, writePassword);

    await store.setPassword('service', 'account', secret);

    expect(items.size).toBeGreaterThan(2);
    expect(writePassword.mock.calls.every(([, value]) => value.length <= 96)).toBe(true);
    expect(writePassword.mock.calls.every(([args]) => !args.join(' ').includes(secret))).toBe(true);
    await expect(store.getPassword('service', 'account')).resolves.toBe(secret);

    await store.setPassword('service', 'account', 'replacement');

    expect(items.size).toBe(1);
    await expect(store.getPassword('service', 'account')).resolves.toBe('replacement');
    await expect(store.deletePassword('service', 'account')).resolves.toBe(true);
    expect(items.size).toBe(0);
  });

  it('updates existing credentials without replacing their stable access list', async () => {
    const run = vi.fn().mockResolvedValue({ code: 44, stdout: '', stderr: 'not found' });
    const writePassword = vi
      .fn()
      .mockResolvedValueOnce({ code: 45, stdout: '', stderr: 'item already exists' })
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' });
    const store = createMacOsKeychainStore(run, writePassword);

    await store.setPassword('service', 'account', 'updated-secret');

    expect(writePassword).toHaveBeenCalledTimes(2);
    expect(writePassword.mock.calls[1][0]).toEqual([
      'add-generic-password',
      '-U',
      '-a',
      'account',
      '-s',
      'service',
      '-w',
    ]);
    expect(writePassword.mock.calls[1][0]).not.toContain('-T');
    expect(writePassword.mock.calls[1][1]).toBe('tangled-cli-keychain-v1:dXBkYXRlZC1zZWNyZXQ');
  });

  it('reads a credential and removes the security command newline', async () => {
    const run = vi.fn().mockResolvedValue({ code: 0, stdout: 'stored-secret\n', stderr: '' });
    const store = createMacOsKeychainStore(run, vi.fn());

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
    const store = createMacOsKeychainStore(run, vi.fn());

    await expect(store.getPassword('service', 'account')).resolves.toBeNull();
  });

  it('rejects invalid envelopes and missing credential chunks without exposing data', async () => {
    const invalidEnvelope = vi.fn().mockResolvedValue({
      code: 0,
      stdout: 'tangled-cli-keychain-v1:not%base64\n',
      stderr: '',
    });
    await expect(
      createMacOsKeychainStore(invalidEnvelope, vi.fn()).getPassword('service', 'account')
    ).rejects.toThrow(InvalidCredentialDataError);

    const missingChunk = vi
      .fn()
      .mockResolvedValueOnce({
        code: 0,
        stdout: 'tangled-cli-keychain-v2:0123456789abcdef:1\n',
        stderr: '',
      })
      .mockResolvedValueOnce({ code: 44, stdout: '', stderr: 'not found' });
    await expect(
      createMacOsKeychainStore(missingChunk, vi.fn()).getPassword('service', 'account')
    ).rejects.toThrow(InvalidCredentialDataError);
  });

  it('can replace and delete a credential with a corrupted chunk manifest', async () => {
    const corrupted = 'tangled-cli-keychain-v2:not-a-valid-manifest\n';
    const setRun = vi.fn().mockResolvedValue({ code: 0, stdout: corrupted, stderr: '' });
    const writePassword = vi
      .fn()
      .mockResolvedValueOnce({ code: 45, stdout: '', stderr: 'item already exists' })
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' });
    const setStore = createMacOsKeychainStore(setRun, writePassword);

    await expect(
      setStore.setPassword('service', 'account', 'replacement')
    ).resolves.toBeUndefined();

    const deleteRun = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, stdout: corrupted, stderr: '' })
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' });
    const deleteStore = createMacOsKeychainStore(deleteRun, vi.fn());
    await expect(deleteStore.deletePassword('service', 'account')).resolves.toBe(true);
  });

  it('reports whether a credential was deleted', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, stdout: 'stored-secret\n', stderr: '' })
      .mockResolvedValueOnce({ code: 0, stdout: '', stderr: '' })
      .mockResolvedValueOnce({ code: 44, stdout: '', stderr: 'not found' });
    const store = createMacOsKeychainStore(run, vi.fn());

    await expect(store.deletePassword('service', 'account')).resolves.toBe(true);
    await expect(store.deletePassword('service', 'account')).resolves.toBe(false);
  });

  it('surfaces Keychain command failures without exposing the secret', async () => {
    const run = vi.fn().mockResolvedValue({ code: 44, stdout: '', stderr: 'not found' });
    const writePassword = vi
      .fn()
      .mockResolvedValue({ code: 1, stdout: 'do-not-print', stderr: 'do-not-print' });
    const store = createMacOsKeychainStore(run, writePassword);

    await expect(store.setPassword('service', 'account', 'do-not-print')).rejects.toThrow(
      'macOS Keychain write failed: exit status 1'
    );
  });

  it('never uses command stdout in a Keychain read error', async () => {
    const run = vi.fn().mockResolvedValue({ code: 1, stdout: 'do-not-print', stderr: '' });
    const store = createMacOsKeychainStore(run, vi.fn());

    await expect(store.getPassword('service', 'account')).rejects.toThrow(
      'macOS Keychain read failed: exit status 1'
    );
  });
});
