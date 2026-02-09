import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIssueCommand } from '../../src/commands/issue.js';
import * as apiClient from '../../src/lib/api-client.js';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import * as context from '../../src/lib/context.js';
import * as issuesApi from '../../src/lib/issues-api.js';
import type { IssueWithMetadata } from '../../src/lib/issues-api.js';
import * as atUri from '../../src/utils/at-uri.js';
import * as bodyInput from '../../src/utils/body-input.js';

// Mock dependencies
vi.mock('../../src/lib/api-client.js');
vi.mock('../../src/lib/issues-api.js');
vi.mock('../../src/lib/context.js');
vi.mock('../../src/utils/at-uri.js');
vi.mock('../../src/utils/body-input.js');

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

      const command = createIssueCommand();
      await command.parseAsync(['node', 'test', 'create', 'Test Issue', '--body', 'Test body']);

      expect(issuesApi.createIssue).toHaveBeenCalledWith({
        client: mockClient,
        repoAtUri: 'at://did:plc:abc123/sh.tangled.repo/test-repo',
        title: 'Test Issue',
        body: 'Test body',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Creating issue...');
      expect(consoleLogSpy).toHaveBeenCalledWith('\n✓ Issue created: #abc123');
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
});
