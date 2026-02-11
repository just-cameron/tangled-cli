import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import {
  closeIssue,
  createIssue,
  deleteIssue,
  getCompleteIssueData,
  getIssue,
  getIssueState,
  listIssues,
  reopenIssue,
  resolveSequentialNumber,
  updateIssue,
} from '../../src/lib/issues-api.js';

// Mock API client factory
const createMockClient = (authenticated = true): TangledApiClient => {
  const mockAgent = {
    com: {
      atproto: {
        repo: {
          createRecord: vi.fn(),
          listRecords: vi.fn(),
          getRecord: vi.fn(),
          putRecord: vi.fn(),
          deleteRecord: vi.fn(),
        },
      },
    },
  };

  return {
    isAuthenticated: vi.fn(async () => authenticated),
    getSession: vi.fn(() =>
      authenticated ? { did: 'did:plc:test123', handle: 'test.bsky.social' } : null
    ),
    getAgent: vi.fn(() => mockAgent),
  } as unknown as TangledApiClient;
};

describe('createIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should create an issue with all fields', async () => {
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
        cid: 'cid123',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    const result = await createIssue({
      client: mockClient,
      repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
      title: 'Bug: Login fails',
      body: 'Detailed description of the bug',
    });

    expect(result).toMatchObject({
      repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
      title: 'Bug: Login fails',
      body: 'Detailed description of the bug',
      uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
      cid: 'cid123',
      author: 'did:plc:test123',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue',
      record: expect.objectContaining({
        $type: 'sh.tangled.repo.issue',
        repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
        title: 'Bug: Login fails',
        body: 'Detailed description of the bug',
        createdAt: expect.any(String),
      }),
    });
  });

  it('should create an issue without body', async () => {
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
        cid: 'cid123',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    const result = await createIssue({
      client: mockClient,
      repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
      title: 'Simple issue',
    });

    expect(result.body).toBeUndefined();
    expect(mockCreateRecord).toHaveBeenCalled();
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      createIssue({
        client: mockClient,
        repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
        title: 'Test',
      })
    ).rejects.toThrow('Must be authenticated');
  });

  it('should throw error on API failure', async () => {
    const mockCreateRecord = vi.fn().mockRejectedValue(new Error('API error'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await expect(
      createIssue({
        client: mockClient,
        repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
        title: 'Test',
      })
    ).rejects.toThrow('Failed to create issue: API error');
  });
});

describe('listIssues', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should list issues for a repository', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
            cid: 'cid1',
            value: {
              $type: 'sh.tangled.repo.issue',
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'Issue 1',
              body: 'Description 1',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue2',
            cid: 'cid2',
            value: {
              $type: 'sh.tangled.repo.issue',
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'Issue 2',
              createdAt: '2024-01-02T00:00:00.000Z',
            },
          },
        ],
        cursor: undefined,
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await listIssues({
      client: mockClient,
      repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
    });

    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toMatchObject({
      title: 'Issue 1',
      body: 'Description 1',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });
  });

  it('should filter issues by repository', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
            cid: 'cid1',
            value: {
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'Issue 1',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue2',
            cid: 'cid2',
            value: {
              repo: 'at://did:plc:owner/sh.tangled.repo/other-repo',
              title: 'Issue 2',
              createdAt: '2024-01-02T00:00:00.000Z',
            },
          },
        ],
        cursor: undefined,
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await listIssues({
      client: mockClient,
      repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
    });

    // Should only include issue from my-repo, not other-repo
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].title).toBe('Issue 1');
  });

  it('should return empty array when no issues found', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [],
        cursor: undefined,
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await listIssues({
      client: mockClient,
      repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
    });

    expect(result.issues).toEqual([]);
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      listIssues({
        client: mockClient,
        repoAtUri: 'at://did:plc:owner/sh.tangled.repo/my-repo',
      })
    ).rejects.toThrow('Must be authenticated');
  });

  it('should throw error for invalid repo URI', async () => {
    await expect(
      listIssues({
        client: mockClient,
        repoAtUri: 'invalid-uri',
      })
    ).rejects.toThrow('Invalid repository AT-URI');
  });
});

describe('getIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should get a specific issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'Test Issue',
          body: 'Test Description',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
          },
        },
      },
    } as never);

    const result = await getIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toMatchObject({
      title: 'Test Issue',
      body: 'Test Description',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      cid: 'cid1',
    });

    expect(mockGetRecord).toHaveBeenCalledWith({
      repo: 'did:plc:owner',
      collection: 'sh.tangled.repo.issue',
      rkey: 'issue1',
    });
  });

  it('should throw error when issue not found', async () => {
    const mockGetRecord = vi.fn().mockRejectedValue(new Error('Record not found'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
          },
        },
      },
    } as never);

    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/nonexistent',
      })
    ).rejects.toThrow('Issue not found');
  });

  it('should throw error for invalid issue URI', async () => {
    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'invalid-uri',
      })
    ).rejects.toThrow('Invalid issue AT-URI');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('updateIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should update issue title', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'old-cid',
        value: {
          repo: 'at://did:plc:test123/sh.tangled.repo/my-repo',
          title: 'Old Title',
          body: 'Original body',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockPutRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'new-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            putRecord: mockPutRecord,
          },
        },
      },
    } as never);

    const result = await updateIssue({
      client: mockClient,
      issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
      title: 'New Title',
    });

    expect(result.title).toBe('New Title');
    expect(result.body).toBe('Original body'); // Body unchanged

    expect(mockPutRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue',
      rkey: 'issue1',
      record: expect.objectContaining({
        title: 'New Title',
        body: 'Original body',
      }),
      swapRecord: 'old-cid',
    });
  });

  it('should update issue body', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'old-cid',
        value: {
          repo: 'at://did:plc:test123/sh.tangled.repo/my-repo',
          title: 'Title',
          body: 'Old body',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockPutRecord = vi.fn().mockResolvedValue({
      data: {
        cid: 'new-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            putRecord: mockPutRecord,
          },
        },
      },
    } as never);

    const result = await updateIssue({
      client: mockClient,
      issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
      body: 'New body',
    });

    expect(result.title).toBe('Title'); // Title unchanged
    expect(result.body).toBe('New body');
  });

  it('should throw error when updating issue not owned by user', async () => {
    await expect(
      updateIssue({
        client: mockClient,
        issueUri: 'at://did:plc:someone-else/sh.tangled.repo.issue/issue1',
        title: 'New Title',
      })
    ).rejects.toThrow('Cannot update issue: you are not the author');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      updateIssue({
        client: mockClient,
        issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        title: 'New Title',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('closeIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should close an issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue.state/state1',
        cid: 'state-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await closeIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue.state',
      record: {
        $type: 'sh.tangled.repo.issue.state',
        issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        state: 'sh.tangled.repo.issue.state.closed',
      },
    });
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      closeIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('deleteIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should delete an issue', async () => {
    const mockDeleteRecord = vi.fn().mockResolvedValue({});

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            deleteRecord: mockDeleteRecord,
          },
        },
      },
    } as never);

    await deleteIssue({
      client: mockClient,
      issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
    });

    expect(mockDeleteRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue',
      rkey: 'issue1',
    });
  });

  it('should throw error when deleting issue not owned by user', async () => {
    await expect(
      deleteIssue({
        client: mockClient,
        issueUri: 'at://did:plc:someone-else/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Cannot delete issue: you are not the author');
  });

  it('should throw error when issue not found', async () => {
    const mockDeleteRecord = vi.fn().mockRejectedValue(new Error('Record not found'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            deleteRecord: mockDeleteRecord,
          },
        },
      },
    } as never);

    await expect(
      deleteIssue({
        client: mockClient,
        issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/nonexistent',
      })
    ).rejects.toThrow('Issue not found');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      deleteIssue({
        client: mockClient,
        issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('getIssueState', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should return open when no state records exist', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: { records: [] },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('open');
    expect(mockListRecords).toHaveBeenCalledWith({
      repo: 'did:plc:owner',
      collection: 'sh.tangled.repo.issue.state',
      limit: 100,
    });
  });

  it('should return closed when latest state record is closed', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/state1',
            cid: 'cid1',
            value: {
              issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
              state: 'sh.tangled.repo.issue.state.closed',
            },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('closed');
  });

  it('should return open when latest state record is open', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/state1',
            cid: 'cid1',
            value: {
              issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
              state: 'sh.tangled.repo.issue.state.closed',
            },
          },
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/state2',
            cid: 'cid2',
            value: {
              issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
              state: 'sh.tangled.repo.issue.state.open',
            },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('open');
  });

  it('should filter state records to only the target issue', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/state1',
            cid: 'cid1',
            value: {
              issue: 'at://did:plc:owner/sh.tangled.repo.issue/other-issue',
              state: 'sh.tangled.repo.issue.state.closed',
            },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    // The closed state is for a different issue, so this one should be open
    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('open');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      getIssueState({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('reopenIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should reopen a closed issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue.state/state1',
        cid: 'state-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await reopenIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue.state',
      record: {
        $type: 'sh.tangled.repo.issue.state',
        issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        state: 'sh.tangled.repo.issue.state.open',
      },
    });
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      reopenIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('resolveSequentialNumber', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should return number directly for #N displayId without an API call (fast path)', async () => {
    const result = await resolveSequentialNumber(
      '#3',
      'at://did:plc:owner/sh.tangled.repo.issue/issue3',
      mockClient,
      'at://did:plc:owner/sh.tangled.repo/my-repo'
    );
    expect(result).toBe(3);
  });

  it('should scan issue list and return 1-based position for rkey displayId', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-a',
            cid: 'cid1',
            value: {
              $type: 'sh.tangled.repo.issue',
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'First',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-b',
            cid: 'cid2',
            value: {
              $type: 'sh.tangled.repo.issue',
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'Second',
              createdAt: '2024-01-02T00:00:00.000Z',
            },
          },
        ],
        cursor: undefined,
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    const result = await resolveSequentialNumber(
      'issue-b',
      'at://did:plc:owner/sh.tangled.repo.issue/issue-b',
      mockClient,
      'at://did:plc:owner/sh.tangled.repo/my-repo'
    );
    expect(result).toBe(2);
  });

  it('should return undefined when issue URI not found in list', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-a',
            cid: 'cid1',
            value: {
              $type: 'sh.tangled.repo.issue',
              repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
              title: 'First',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        cursor: undefined,
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { listRecords: mockListRecords } } },
    } as never);

    const result = await resolveSequentialNumber(
      'nonexistent',
      'at://did:plc:owner/sh.tangled.repo.issue/nonexistent',
      mockClient,
      'at://did:plc:owner/sh.tangled.repo/my-repo'
    );
    expect(result).toBeUndefined();
  });
});

describe('getCompleteIssueData', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should return all fields including fetched state', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'Test Issue',
          body: 'Test body',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    // getIssueState uses listRecords on the state collection
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/s1',
            cid: 'scid1',
            value: {
              issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
              state: 'sh.tangled.repo.issue.state.closed',
            },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord, listRecords: mockListRecords } } },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#1', // fast-path for number — no listRecords call for issues
      'at://did:plc:owner/sh.tangled.repo/my-repo'
    );

    expect(result).toEqual({
      number: 1,
      title: 'Test Issue',
      body: 'Test body',
      state: 'closed',
      author: 'did:plc:owner',
      createdAt: '2024-01-01T00:00:00.000Z',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      cid: 'cid1',
    });
  });

  it('should use stateOverride and skip the getIssueState network call', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockListRecords = vi.fn();
    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord, listRecords: mockListRecords } } },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#2',
      'at://did:plc:owner/sh.tangled.repo/my-repo',
      'closed'
    );

    expect(result.number).toBe(2);
    expect(result.state).toBe('closed');
    expect(mockListRecords).not.toHaveBeenCalled();
  });

  it('should return undefined body and default open state when issue has no body or state records', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'at://did:plc:owner/sh.tangled.repo/my-repo',
          title: 'No body issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#1',
      'at://did:plc:owner/sh.tangled.repo/my-repo'
    );

    expect(result.body).toBeUndefined();
    expect(result.state).toBe('open');
  });
});
