import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIssueCommand } from '../../src/commands/issue.js';
import * as apiClient from '../../src/lib/api-client.js';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import * as context from '../../src/lib/context.js';
import * as issuesApi from '../../src/lib/issues-api.js';
import type { IssueWithMetadata } from '../../src/lib/issues-api.js';
import * as atUri from '../../src/utils/at-uri.js';
import * as authHelpers from '../../src/utils/auth-helpers.js';
import * as bodyInput from '../../src/utils/body-input.js';

// Mock dependencies
vi.mock('../../src/lib/api-client.js');
vi.mock('../../src/lib/issues-api.js');
vi.mock('../../src/lib/context.js');
vi.mock('../../src/utils/at-uri.js');
vi.mock('../../src/utils/body-input.js');
vi.mock('../../src/utils/auth-helpers.js');
vi.mock('@inquirer/prompts');

describe('issue create command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    // Mock API client
    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    // Mock context
    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    // Mock AT-URI builder
    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue(
      'at://did:plc:abc123/sh.tangled.repo/test-repo'
    );

    // Mock body input
    vi.mocked(bodyInput.readBodyInput).mockResolvedValue(undefined);

    // Default listIssues mock (needed for sequential number computation after create)
    vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [], cursor: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create with --body flag', () => {
    it('should create issue with body text', async () => {
      const mockIssue: IssueWithMetadata = {
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: 'Test body',
        createdAt: new Date().toISOString(),
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/abc123',
        cid: 'bafyreiabc123',
        author: 'did:plc:abc123',
      };

      vi.mocked(bodyInput.readBodyInput).mockResolvedValue('Test body');
      vi.mocked(issuesApi.createIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'create', 'Test Issue', '--body', 'Test body']);

      expect(issuesApi.createIssue).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: 'Test body',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Creating issue...');
      expect(consoleLogSpy).toHaveBeenCalledWith('\n✓ Issue #1 created');
    });
  });

  describe('create with --body-file flag', () => {
    it('should create issue with body from file', async () => {
      const mockIssue: IssueWithMetadata = {
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: 'Body from file',
        createdAt: new Date().toISOString(),
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/xyz789',
        cid: 'bafyreixyz789',
        author: 'did:plc:abc123',
      };

      vi.mocked(bodyInput.readBodyInput).mockResolvedValue('Body from file');
      vi.mocked(issuesApi.createIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync([
        'node',
        'test',
        'create',
        'Test Issue',
        '--body-file',
        '/tmp/body.txt',
      ]);

      expect(bodyInput.readBodyInput).toHaveBeenCalledWith(undefined, '/tmp/body.txt');
      expect(issuesApi.createIssue).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: 'Body from file',
      });
    });
  });

  describe('create without body', () => {
    it('should create issue without body', async () => {
      const mockIssue: IssueWithMetadata = {
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        createdAt: new Date().toISOString(),
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/test123',
        cid: 'bafyreitest123',
        author: 'did:plc:abc123',
      };

      vi.mocked(bodyInput.readBodyInput).mockResolvedValue(undefined);
      vi.mocked(issuesApi.createIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'create', 'Test Issue']);

      expect(issuesApi.createIssue).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: undefined,
      });
    });
  });

  describe('authentication required', () => {
    it('should fail when not authenticated', async () => {
      vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'create', 'Test Issue'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '✗ Not authenticated. Run "tangled auth login" first.'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('context required', () => {
    it('should fail when not in a Tangled repository', async () => {
      vi.mocked(context.getCurrentRepoContext).mockResolvedValue(null);

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'create', 'Test Issue'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Not in a Tangled repository');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('validation errors', () => {
    it('should fail with empty title', async () => {
      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'create', ''])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue title cannot be empty')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should fail with title over 256 characters', async () => {
      const longTitle = 'A'.repeat(257);

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'create', longTitle])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue title must be 256 characters or less')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should fail with body over 50,000 characters', async () => {
      const longBody = 'A'.repeat(50001);

      vi.mocked(bodyInput.readBodyInput).mockResolvedValue(longBody);

      const command = createIssueCommand();

      await expect(
        command.parseAsync(['node', 'test', 'create', 'Test Issue', '--body', longBody])
      ).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Issue body must be 50,000 characters or less')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('API errors', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(issuesApi.createIssue).mockRejectedValue(new Error('Network error'));

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'create', 'Test Issue'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Failed to create issue: Network error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('JSON output', () => {
    const mockIssue: IssueWithMetadata = {
      $type: 'sh.tangled.repo.issue',
      repo: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
      title: 'Test Issue',
      body: 'Test body',
      createdAt: '2024-01-01T00:00:00.000Z',
      uri: 'at://did:plc:abc123/sh.tangled.repo.issue/abc123',
      cid: 'bafyreiabc123',
      author: 'did:plc:abc123',
    };

    it('should output JSON of created issue when --json is passed', async () => {
      vi.mocked(issuesApi.createIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'create', 'Test Issue', '--json']);

      // Should NOT print human-readable messages
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Creating issue...');

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toMatchObject({
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        author: 'did:plc:abc123',
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/abc123',
        cid: 'bafyreiabc123',
      });
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      vi.mocked(issuesApi.createIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'create', 'Test Issue', '--json', 'number,uri']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({
        number: 1,
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/abc123',
      });
      expect(jsonOutput).not.toHaveProperty('title');
      expect(jsonOutput).not.toHaveProperty('body');
      expect(jsonOutput).not.toHaveProperty('author');
    });
  });
});

describe('issue list command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    // Mock API client
    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    // Mock context
    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    // Mock AT-URI builder
    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list issues', () => {
    it('should list issues successfully', async () => {
      const mockIssues: IssueWithMetadata[] = [
        {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
          title: 'First Issue',
          createdAt: new Date('2024-01-01').toISOString(),
          uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
          cid: 'bafyrei1',
          author: 'did:plc:abc123',
        },
        {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
          title: 'Second Issue',
          createdAt: new Date('2024-01-02').toISOString(),
          uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue2',
          cid: 'bafyrei2',
          author: 'did:plc:abc123',
        },
      ];

      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: mockIssues,
        cursor: undefined,
      });
      vi.mocked(issuesApi.getIssueState).mockResolvedValue('open');

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list']);

      expect(issuesApi.listIssues).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
        limit: 50,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nFound 2 issues:\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('  #1  [OPEN]  First Issue');
      expect(consoleLogSpy).toHaveBeenCalledWith('  #2  [OPEN]  Second Issue');
    });

    it('should handle custom limit', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [],
        cursor: undefined,
      });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list', '--limit', '25']);

      expect(issuesApi.listIssues).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
        limit: 25,
      });
    });

    it('should handle empty issue list', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [],
        cursor: undefined,
      });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list']);

      expect(consoleLogSpy).toHaveBeenCalledWith('No issues found for this repository.');
    });
  });

  describe('authentication required', () => {
    it('should fail when not authenticated', async () => {
      vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list'])).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '✗ Not authenticated. Run "tangled auth login" first.'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('context required', () => {
    it('should fail when not in a Tangled repository', async () => {
      vi.mocked(context.getCurrentRepoContext).mockResolvedValue(null);

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list'])).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Not in a Tangled repository');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('validation errors', () => {
    it('should fail with invalid limit (too low)', async () => {
      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list', '--limit', '0'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Invalid limit. Must be between 1 and 100.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should fail with invalid limit (too high)', async () => {
      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list', '--limit', '101'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Invalid limit. Must be between 1 and 100.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should fail with non-numeric limit', async () => {
      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list', '--limit', 'abc'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Invalid limit. Must be between 1 and 100.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('API errors', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(issuesApi.listIssues).mockRejectedValue(new Error('Network error'));

      const command = createIssueCommand();

      await expect(command.parseAsync(['node', 'test', 'list'])).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Failed to list issues: Network error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('JSON output', () => {
    const mockIssues: IssueWithMetadata[] = [
      {
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
        title: 'First Issue',
        body: 'First body',
        createdAt: new Date('2024-01-01').toISOString(),
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
        cid: 'bafyrei1',
        author: 'did:plc:abc123',
      },
      {
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
        title: 'Second Issue',
        createdAt: new Date('2024-01-02').toISOString(),
        uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue2',
        cid: 'bafyrei2',
        author: 'did:plc:abc123',
      },
    ];

    beforeEach(() => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: mockIssues,
        cursor: undefined,
      });
      vi.mocked(issuesApi.getIssueState).mockResolvedValue('open');
    });

    it('should output JSON array when --json is passed', async () => {
      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(Array.isArray(jsonOutput)).toBe(true);
      expect(jsonOutput).toHaveLength(2);
      expect(jsonOutput[0]).toMatchObject({
        number: 1,
        title: 'First Issue',
        state: 'open',
        author: 'did:plc:abc123',
      });
      expect(jsonOutput[1]).toMatchObject({ number: 2, title: 'Second Issue' });
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list', '--json', 'number,title,state']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput[0]).toEqual({ number: 1, title: 'First Issue', state: 'open' });
      expect(jsonOutput[0]).not.toHaveProperty('author');
      expect(jsonOutput[0]).not.toHaveProperty('uri');
    });

    it('should output empty JSON array when no issues exist', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [], cursor: undefined });

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'list', '--json']);

      expect(consoleLogSpy).toHaveBeenCalledWith('[]');
    });
  });
});

describe('issue view command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockIssue: IssueWithMetadata = {
    $type: 'sh.tangled.repo.issue',
    repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
    title: 'Test Issue',
    body: 'Issue body',
    createdAt: new Date('2024-01-01').toISOString(),
    uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    cid: 'bafyrei1',
    author: 'did:plc:abc123',
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');

    vi.mocked(authHelpers.requireAuth).mockResolvedValue({
      did: 'did:plc:abc123',
      handle: 'test.bsky.social',
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should view issue by number', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
    vi.mocked(issuesApi.getIssueState).mockResolvedValue('open');

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'view', '1']);

    expect(issuesApi.getIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
    });
    expect(issuesApi.getIssueState).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('\nIssue #1 [OPEN]');
    expect(consoleLogSpy).toHaveBeenCalledWith('Title: Test Issue');
    expect(consoleLogSpy).toHaveBeenCalledWith('\nBody:');
    expect(consoleLogSpy).toHaveBeenCalledWith('Issue body');
  });

  it('should view issue by rkey', async () => {
    vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
    vi.mocked(issuesApi.getIssueState).mockResolvedValue('closed');

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'view', 'issue1']);

    expect(issuesApi.getIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('\nIssue issue1 [CLOSED]');
  });

  it('should show issue without body', async () => {
    const issueWithoutBody = { ...mockIssue, body: undefined };
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [issueWithoutBody],
      cursor: undefined,
    });
    vi.mocked(issuesApi.getIssue).mockResolvedValue(issueWithoutBody);
    vi.mocked(issuesApi.getIssueState).mockResolvedValue('open');

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'view', '1']);

    const allCalls = consoleLogSpy.mock.calls.map((c) => c[0]);
    expect(allCalls).not.toContain('Body:');
  });

  it('should fail when not authenticated', async () => {
    vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'view', '1'])).rejects.toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✗ Not authenticated. Run "tangled auth login" first.'
    );
  });

  it('should fail when not in a Tangled repository', async () => {
    vi.mocked(context.getCurrentRepoContext).mockResolvedValue(null);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'view', '1'])).rejects.toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Not in a Tangled repository');
  });

  it('should fail when issue number is out of range', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'view', '99'])).rejects.toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Issue #99 not found'));
  });

  describe('JSON output', () => {
    it('should output JSON when --json is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [mockIssue],
        cursor: undefined,
      });
      vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.getIssueState).mockResolvedValue('open');

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'view', '1', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toMatchObject({
        title: 'Test Issue',
        body: 'Issue body',
        state: 'open',
        author: 'did:plc:abc123',
        uri: mockIssue.uri,
        cid: mockIssue.cid,
      });
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [mockIssue],
        cursor: undefined,
      });
      vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
      vi.mocked(issuesApi.getIssueState).mockResolvedValue('closed');

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'view', '1', '--json', 'title,state']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({ title: 'Test Issue', state: 'closed' });
      expect(jsonOutput).not.toHaveProperty('body');
      expect(jsonOutput).not.toHaveProperty('author');
    });
  });
});

describe('issue edit command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockIssue: IssueWithMetadata = {
    $type: 'sh.tangled.repo.issue',
    repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
    title: 'Original Title',
    createdAt: new Date('2024-01-01').toISOString(),
    uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    cid: 'bafyrei1',
    author: 'did:plc:abc123',
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');

    vi.mocked(bodyInput.readBodyInput).mockResolvedValue(undefined);
    vi.mocked(authHelpers.requireAuth).mockResolvedValue({
      did: 'did:plc:abc123',
      handle: 'test.bsky.social',
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should edit issue title by number', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.updateIssue).mockResolvedValue({ ...mockIssue, title: 'New Title' });

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'edit', '1', '--title', 'New Title']);

    expect(issuesApi.updateIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
      title: 'New Title',
      body: undefined,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Issue #1 updated');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Updated: title');
  });

  it('should edit issue body', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(bodyInput.readBodyInput).mockResolvedValue('New body');
    vi.mocked(issuesApi.updateIssue).mockResolvedValue({ ...mockIssue, body: 'New body' });

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'edit', '1', '--body', 'New body']);

    expect(issuesApi.updateIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
      title: undefined,
      body: 'New body',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('  Updated: body');
  });

  it('should fail when no options provided', async () => {
    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'edit', '1'])).rejects.toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✗ At least one of --title, --body, or --body-file must be provided'
    );
  });

  it('should fail when not authenticated', async () => {
    vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(
      command.parseAsync(['node', 'test', 'edit', '1', '--title', 'New'])
    ).rejects.toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✗ Not authenticated. Run "tangled auth login" first.'
    );
  });

  describe('JSON output', () => {
    it('should output JSON of updated issue when --json is passed', async () => {
      const updatedIssue = { ...mockIssue, title: 'New Title' };
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [mockIssue],
        cursor: undefined,
      });
      vi.mocked(issuesApi.updateIssue).mockResolvedValue(updatedIssue);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'edit', '1', '--title', 'New Title', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toMatchObject({
        title: 'New Title',
        author: 'did:plc:abc123',
        uri: mockIssue.uri,
        cid: mockIssue.cid,
      });
      // Human-readable messages should NOT appear
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✓ Issue #1 updated');
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      const updatedIssue = { ...mockIssue, title: 'New Title' };
      vi.mocked(issuesApi.listIssues).mockResolvedValue({
        issues: [mockIssue],
        cursor: undefined,
      });
      vi.mocked(issuesApi.updateIssue).mockResolvedValue(updatedIssue);

      const command = createIssueCommand();
      await command.parseAsync([
        'node',
        'test',
        'edit',
        '1',
        '--title',
        'New Title',
        '--json',
        'title,uri',
      ]);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({
        title: 'New Title',
        uri: mockIssue.uri,
      });
      expect(jsonOutput).not.toHaveProperty('author');
    });
  });
});

describe('issue close command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  const mockIssue: IssueWithMetadata = {
    $type: 'sh.tangled.repo.issue',
    repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
    title: 'Test Issue',
    createdAt: new Date('2024-01-01').toISOString(),
    uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    cid: 'bafyrei1',
    author: 'did:plc:abc123',
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');
    vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should close issue by number', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.closeIssue).mockResolvedValue(undefined);

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'close', '1']);

    expect(issuesApi.closeIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Issue #1 closed');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Title: Test Issue');
  });

  it('should fail when not authenticated', async () => {
    vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'close', '1'])).rejects.toThrow(
      'process.exit(1)'
    );
  });

  describe('JSON output', () => {
    it('should output JSON when --json is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.closeIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'close', '1', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({
        number: 1,
        title: 'Test Issue',
        uri: mockIssue.uri,
        state: 'closed',
        cid: mockIssue.cid,
      });
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.closeIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'close', '1', '--json', 'number,state']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({ number: 1, state: 'closed' });
      expect(jsonOutput).not.toHaveProperty('title');
      expect(jsonOutput).not.toHaveProperty('uri');
    });
  });
});

describe('issue reopen command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  const mockIssue: IssueWithMetadata = {
    $type: 'sh.tangled.repo.issue',
    repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
    title: 'Test Issue',
    createdAt: new Date('2024-01-01').toISOString(),
    uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    cid: 'bafyrei1',
    author: 'did:plc:abc123',
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');
    vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reopen issue by number', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.reopenIssue).mockResolvedValue(undefined);

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'reopen', '1']);

    expect(issuesApi.reopenIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Issue #1 reopened');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Title: Test Issue');
  });

  it('should fail when not authenticated', async () => {
    vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'reopen', '1'])).rejects.toThrow(
      'process.exit(1)'
    );
  });

  describe('JSON output', () => {
    it('should output JSON when --json is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.reopenIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'reopen', '1', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({
        number: 1,
        title: 'Test Issue',
        uri: mockIssue.uri,
        state: 'open',
        cid: mockIssue.cid,
      });
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.reopenIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'reopen', '1', '--json', 'number,state']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({ number: 1, state: 'open' });
      expect(jsonOutput).not.toHaveProperty('title');
    });
  });
});

describe('issue delete command', () => {
  let mockClient: TangledApiClient;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  const mockIssue: IssueWithMetadata = {
    $type: 'sh.tangled.repo.issue',
    repo: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
    title: 'Test Issue',
    createdAt: new Date('2024-01-01').toISOString(),
    uri: 'at://did:plc:abc123/sh.tangled.repo.issue/issue1',
    cid: 'bafyrei1',
    author: 'did:plc:abc123',
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    mockClient = {
      resumeSession: vi.fn(async () => true),
    } as unknown as TangledApiClient;
    vi.mocked(apiClient.createApiClient).mockReturnValue(mockClient);

    vi.mocked(context.getCurrentRepoContext).mockResolvedValue({
      owner: 'test.bsky.social',
      ownerType: 'handle',
      name: 'test-repo',
      remoteName: 'origin',
      remoteUrl: 'git@tangled.org:test.bsky.social/test-repo.git',
      protocol: 'ssh',
    });

    vi.mocked(atUri.buildRepoAtUri).mockResolvedValue('at://did:plc:abc123/sh.tangled.repo/xyz789');
    vi.mocked(issuesApi.getIssue).mockResolvedValue(mockIssue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete issue with --force flag', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.deleteIssue).mockResolvedValue(undefined);

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'delete', '1', '--force']);

    expect(issuesApi.deleteIssue).toHaveBeenCalledWith({
      client: mockClient,
      issueUri: mockIssue.uri,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Issue #1 deleted');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Title: Test Issue');
  });

  it('should cancel deletion when user declines confirmation', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });

    const { confirm } = await import('@inquirer/prompts');
    vi.mocked(confirm).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'delete', '1'])).rejects.toThrow(
      'process.exit(0)'
    );

    expect(issuesApi.deleteIssue).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Deletion cancelled.');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should delete when user confirms', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      issues: [mockIssue],
      cursor: undefined,
    });
    vi.mocked(issuesApi.deleteIssue).mockResolvedValue(undefined);

    const { confirm } = await import('@inquirer/prompts');
    vi.mocked(confirm).mockResolvedValue(true);

    const command = createIssueCommand();
    await command.parseAsync(['node', 'test', 'delete', '1']);

    expect(issuesApi.deleteIssue).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Issue #1 deleted');
    expect(consoleLogSpy).toHaveBeenCalledWith('  Title: Test Issue');
  });

  it('should fail when not authenticated', async () => {
    vi.mocked(mockClient.resumeSession).mockResolvedValue(false);

    const command = createIssueCommand();
    await expect(command.parseAsync(['node', 'test', 'delete', '1', '--force'])).rejects.toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✗ Not authenticated. Run "tangled auth login" first.'
    );
  });

  describe('JSON output', () => {
    it('should output JSON when --json is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.deleteIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'delete', '1', '--force', '--json']);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({
        number: 1,
        title: 'Test Issue',
        uri: mockIssue.uri,
        cid: mockIssue.cid,
      });
      expect(jsonOutput).not.toHaveProperty('state');
    });

    it('should output filtered JSON when --json with fields is passed', async () => {
      vi.mocked(issuesApi.listIssues).mockResolvedValue({ issues: [mockIssue], cursor: undefined });
      vi.mocked(issuesApi.deleteIssue).mockResolvedValue(undefined);

      const command = createIssueCommand();
      await command.parseAsync([
        'node',
        'test',
        'delete',
        '1',
        '--force',
        '--json',
        'number,title',
      ]);

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(jsonOutput).toEqual({ number: 1, title: 'Test Issue' });
      expect(jsonOutput).not.toHaveProperty('uri');
      expect(jsonOutput).not.toHaveProperty('cid');
    });
  });
});
