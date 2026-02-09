import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContextCommand } from '../../src/commands/context.js';

// Mock modules
vi.mock('../../src/lib/context.js');

// Import mocked modules
import * as contextModule from '../../src/lib/context.js';

describe('Context Command', () => {
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;

    // Mock process.exit to throw so tests don't actually exit
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  it('should display repository context when in tangled repo', async () => {
    vi.mocked(contextModule.getCurrentRepoContext).mockResolvedValue({
      owner: 'did:plc:b2mcbcamkwyznc5fkplwlxbf',
      ownerType: 'did',
      name: 'tangled-cli',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git',
      protocol: 'ssh',
    });

    const context = createContextCommand();
    await context.parseAsync(['node', 'test']);

    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Repository context resolved:\n');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Owner: did:plc:b2mcbcamkwyznc5fkplwlxbf (did)');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Repository: tangled-cli');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Protocol: ssh');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '  Remote: origin (git@tangled.org:did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git)'
    );
  });

  it('should display context for HTTPS remote with handle', async () => {
    vi.mocked(contextModule.getCurrentRepoContext).mockResolvedValue({
      owner: 'markbennett.ca',
      ownerType: 'handle',
      name: 'tangled-cli',
      remoteName: 'origin',
      remoteUrl: 'https://tangled.org/markbennett.ca/tangled-cli',
      protocol: 'https',
    });

    const context = createContextCommand();
    await context.parseAsync(['node', 'test']);

    expect(consoleLogSpy).toHaveBeenCalledWith('  Owner: markbennett.ca (handle)');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Protocol: https');
  });

  it('should show error when not in tangled repository', async () => {
    vi.mocked(contextModule.getCurrentRepoContext).mockResolvedValue(null);

    const context = createContextCommand();
    await expect(context.parseAsync(['node', 'test'])).rejects.toThrow('process.exit(1)');

    expect(consoleLogSpy).toHaveBeenCalledWith('✗ Not in a Tangled repository');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('To use this repository with Tangled')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('git remote add origin git@tangled.org:')
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(contextModule.getCurrentRepoContext).mockRejectedValue(new Error('Git error'));

    const context = createContextCommand();
    await expect(context.parseAsync(['node', 'test'])).rejects.toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve context')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Git error'));
  });
});
