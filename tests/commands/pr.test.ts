import { confirm } from '@inquirer/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrCommand } from '../../src/commands/pr.js';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import * as apiClient from '../../src/lib/api-client.js';
import * as context from '../../src/lib/context.js';
import type { PullWithMetadata } from '../../src/lib/pulls-api.js';
import * as pullsApi from '../../src/lib/pulls-api.js';
import * as atUri from '../../src/utils/at-uri.js';
import * as authHelpers from '../../src/utils/auth-helpers.js';
import * as bodyInput from '../../src/utils/body-input.js';

// Mock dependencies
vi.mock('../../src/lib/api-client.js');
vi.mock('../../src/lib/pulls-api.js');
vi.mock('../../src/lib/context.js');
vi.mock('../../src/utils/at-uri.js');
vi.mock('../../src/utils/body-input.js');
vi.mock('../../src/utils/auth-helpers.js');
vi.mock('@inquirer/prompts');
vi.mock('simple-git');
vi.mock('node:zlib');

const REPO_DID = 'did:plc:abc123';
const PULL_AT_URI = 'at://did:plc:abc123/sh.tangled.repo.pull/pull123';

const makePull = (overrides: Partial<PullWithMetadata> = {}): PullWithMetadata => ({
  $type: 'sh.tangled.repo.pull',
  target: { repo: REPO_DID, branch: 'main', repoDid: REPO_DID },
  title: 'Test PR',
  rounds: [{ createdAt: '2024-01-01T00:00:00.000Z', patchBlob: {} as never }],
  source: { branch: 'feature/test' },
  createdAt: '2024-01-01T00:00:00.000Z',
  uri: PULL_AT_URI,
  cid: 'bafyreiabc123',
  author: 'did:plc:abc123',
  ...overrides,
});

describe('pr list command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = { resumeSession: vi.fn(async () => true) } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.resolveRepoDid).mockResolvedValue(REPO_DID);
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [], cursor: undefined });
    vi.mocked(pullsApi.getPullState).mockResolvedValue('open');
    vi.mocked(authHelpers.ensureAuthenticated).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show empty message when no pull requests exist', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'list']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No pull requests found'));
  });

  it('should list pull requests with number and title', async () => {
    const pull = makePull();
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [pull], cursor: undefined });

    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'list']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('#1'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test PR'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[OPEN]'));
  });

  it('should output JSON when --json flag is provided', async () => {
    const pull = makePull();
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [pull], cursor: undefined });

    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'list', '--json']);

    const jsonOutput = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
    expect(jsonOutput.items).toHaveLength(1);
  });

  it('should output [] JSON when no pulls and --json', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'list', '--json']);
    expect(JSON.parse(String(consoleLogSpy.mock.calls[0][0]))).toMatchObject({
      items: [],
      count: 0,
    });
  });

  it('should exit 1 when not in a Tangled repository', async () => {
    vi.mocked(context.getCurrentRepoContext).mockResolvedValue(null);
    const command = createPrCommand();
    await expect(command.parseAsync(['node', 'test', 'list'])).rejects.toThrow('process.exit(1)');
  });

  it('should exit 1 when auth fails', async () => {
    vi.mocked(authHelpers.ensureAuthenticated).mockRejectedValue(new Error('Not authenticated'));
    const command = createPrCommand();
    await expect(command.parseAsync(['node', 'test', 'list'])).rejects.toThrow('process.exit(1)');
  });
});

describe('pr view command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = { resumeSession: vi.fn(async () => true) } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.resolveRepoDid).mockResolvedValue(REPO_DID);
    vi.mocked(authHelpers.ensureAuthenticated).mockResolvedValue(undefined);

    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [makePull()], cursor: undefined });
    vi.mocked(pullsApi.getCompletePullData).mockResolvedValue({
      number: 1,
      title: 'Test PR',
      body: 'Description',
      state: 'open',
      author: 'did:plc:abc123',
      createdAt: '2024-01-01T00:00:00.000Z',
      uri: PULL_AT_URI,
      cid: 'bafyreiabc123',
      sourceBranch: 'feature/test',
      targetBranch: 'main',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display pull request details', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'view', '1']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test PR'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[OPEN]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('feature/test → main'));
  });

  it('should output JSON when --json flag is provided', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'view', '1', '--json']);

    const jsonOutput = consoleLogSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    });
    expect(jsonOutput).toBeDefined();
  });

  it('should resolve rkey identifiers from repository pull records', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'view', 'pull123']);

    expect(pullsApi.getCompletePullData).toHaveBeenCalledWith(
      mockClient,
      PULL_AT_URI,
      'pull123',
      REPO_DID
    );
  });

  it('should exit 1 for pull request not found', async () => {
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [], cursor: undefined });
    const command = createPrCommand();
    await expect(command.parseAsync(['node', 'test', 'view', '99'])).rejects.toThrow(
      'process.exit(1)'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });
});

describe('pr create command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = { resumeSession: vi.fn(async () => true) } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.resolveRepoDid).mockResolvedValue(REPO_DID);
    vi.mocked(authHelpers.ensureAuthenticated).mockResolvedValue(undefined);
    vi.mocked(bodyInput.readBodyInput).mockResolvedValue(undefined);

    // Mock simple-git
    const { simpleGit } = await import('simple-git');
    vi.mocked(simpleGit).mockReturnValue({
      revparse: vi.fn().mockResolvedValue('feature/test\n'),
      log: vi.fn().mockResolvedValue({ total: 0, all: [] }),
      diff: vi.fn().mockResolvedValue('diff --git a/file.ts b/file.ts\n+new line\n'),
    } as never);

    // Mock gzip
    const zlib = await import('node:zlib');
    vi.mocked(zlib.gzip).mockImplementation((_buf, cb) => {
      (cb as (err: null, result: Buffer) => void)(null, Buffer.from('gzip-compressed'));
    });

    const pull = makePull();
    vi.mocked(pullsApi.createPull).mockResolvedValue(pull);
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [pull], cursor: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a pull request and display success', async () => {
    const command = createPrCommand();
    await command.parseAsync([
      'node',
      'test',
      'create',
      '--title',
      'Test PR',
      '--base',
      'main',
      '--head',
      'feature/test',
    ]);

    expect(pullsApi.createPull).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test PR',
        targetBranch: 'main',
        sourceBranch: 'feature/test',
      })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test PR'));
  });

  it('should exit 1 when no diff between branches', async () => {
    const { simpleGit } = await import('simple-git');
    vi.mocked(simpleGit).mockReturnValue({
      revparse: vi.fn().mockResolvedValue('feature/test\n'),
      log: vi.fn().mockResolvedValue({ total: 0, all: [] }),
      diff: vi.fn().mockResolvedValue(''),
    } as never);

    const command = createPrCommand();
    await expect(
      command.parseAsync([
        'node',
        'test',
        'create',
        '--title',
        'Empty PR',
        '--base',
        'main',
        '--head',
        'feature/test',
      ])
    ).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No diff found'));
  });

  it('should output JSON when --json flag is provided', async () => {
    const command = createPrCommand();
    await command.parseAsync([
      'node',
      'test',
      'create',
      '--title',
      'Test PR',
      '--base',
      'main',
      '--head',
      'feature/test',
      '--json',
    ]);

    const jsonOutput = consoleLogSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
      } catch {
        return false;
      }
    });
    expect(jsonOutput).toBeDefined();
  });

  it('should exit 1 in non-interactive mode when behind base', async () => {
    const { simpleGit } = await import('simple-git');
    vi.mocked(simpleGit).mockReturnValue({
      revparse: vi.fn().mockResolvedValue('feature/test\n'),
      log: vi.fn().mockResolvedValue({ total: 3, all: [] }),
      diff: vi.fn().mockResolvedValue('some diff'),
    } as never);

    const command = createPrCommand();
    await expect(
      command.parseAsync([
        'node',
        'test',
        'create',
        '--title',
        'Test PR',
        '--base',
        'main',
        '--head',
        'feature/test',
        '--json',
      ])
    ).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('behind'));
  });

  it('should exit 1 when title is missing', async () => {
    const command = createPrCommand();
    await expect(
      command.parseAsync(['node', 'test', 'create', '--base', 'main', '--head', 'feature/test'])
    ).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required'));
  });

  it('should proceed when --skip-behind-check is provided even if behind', async () => {
    const { simpleGit } = await import('simple-git');
    vi.mocked(simpleGit).mockReturnValue({
      revparse: vi.fn().mockResolvedValue('feature/test\n'),
      log: vi.fn().mockResolvedValue({ total: 3, all: [] }),
      diff: vi.fn().mockResolvedValue('some diff content'),
    } as never);

    const command = createPrCommand();
    await command.parseAsync([
      'node',
      'test',
      'create',
      '--title',
      'Test PR',
      '--base',
      'main',
      '--head',
      'feature/test',
      '--skip-behind-check',
    ]);

    expect(pullsApi.createPull).toHaveBeenCalled();
  });
});

describe('pr delete command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = { resumeSession: vi.fn(async () => true) } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.resolveRepoDid).mockResolvedValue(REPO_DID);
    vi.mocked(authHelpers.ensureAuthenticated).mockResolvedValue(undefined);
    vi.mocked(pullsApi.listPulls).mockResolvedValue({ pulls: [makePull()], cursor: undefined });
    vi.mocked(pullsApi.getCompletePullData).mockResolvedValue({
      number: 1,
      title: 'Test PR',
      state: 'open',
      author: 'did:plc:abc123',
      createdAt: '2024-01-01T00:00:00.000Z',
      uri: PULL_AT_URI,
      cid: 'bafyreiabc123',
      sourceBranch: 'feature/test',
      targetBranch: 'main',
    });
    vi.mocked(pullsApi.deletePull).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete after confirmation', async () => {
    vi.mocked(confirm).mockResolvedValue(true);

    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'delete', '1']);

    expect(pullsApi.deletePull).toHaveBeenCalledWith({ client: mockClient, pullUri: PULL_AT_URI });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('deleted'));
  });

  it('should abort without deleting when confirmation is declined', async () => {
    vi.mocked(confirm).mockResolvedValue(false);

    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'delete', '1']);

    expect(pullsApi.deletePull).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Aborted.');
  });

  it('should skip the prompt with --yes', async () => {
    const command = createPrCommand();
    await command.parseAsync(['node', 'test', 'delete', '1', '--yes']);

    expect(confirm).not.toHaveBeenCalled();
    expect(pullsApi.deletePull).toHaveBeenCalledWith({ client: mockClient, pullUri: PULL_AT_URI });
  });

  it('should exit 1 when deletion fails', async () => {
    vi.mocked(pullsApi.deletePull).mockRejectedValue(new Error('you are not the author'));

    const command = createPrCommand();
    await expect(command.parseAsync(['node', 'test', 'delete', '1', '--yes'])).rejects.toThrow(
      'process.exit(1)'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not the author'));
  });
});
