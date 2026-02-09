import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildRepoAtUri,
	parseAtUri,
	resolveHandleToDid,
} from '../../src/utils/at-uri.js';
import type { TangledApiClient } from '../../src/lib/api-client.js';

// Mock API client
const createMockClient = (): TangledApiClient => {
	return {
		getAgent: vi.fn(() => ({
			com: {
				atproto: {
					identity: {
						resolveHandle: vi.fn(),
					},
				},
			},
		})),
	} as unknown as TangledApiClient;
};

describe('parseAtUri', () => {
	it('should parse AT-URI with rkey', () => {
		const uri = 'at://did:plc:abc123/sh.tangled.repo.issue/xyz789';
		const result = parseAtUri(uri);

		expect(result).toEqual({
			did: 'did:plc:abc123',
			collection: 'sh.tangled.repo.issue',
			rkey: 'xyz789',
		});
	});

	it('should parse AT-URI without rkey', () => {
		const uri = 'at://did:plc:abc123/sh.tangled.repo';
		const result = parseAtUri(uri);

		expect(result).toEqual({
			did: 'did:plc:abc123',
			collection: 'sh.tangled.repo',
		});
	});

	it('should parse AT-URI with nested collection', () => {
		const uri = 'at://did:plc:abc123/sh.tangled.repo.issue.state/xyz';
		const result = parseAtUri(uri);

		expect(result).toEqual({
			did: 'did:plc:abc123',
			collection: 'sh.tangled.repo.issue.state',
			rkey: 'xyz',
		});
	});

	it('should return null for invalid URI', () => {
		expect(parseAtUri('not-a-uri')).toBeNull();
		expect(parseAtUri('http://example.com')).toBeNull();
		expect(parseAtUri('at://invalid-did/collection')).toBeNull();
		expect(parseAtUri('')).toBeNull();
	});

	it('should handle DIDs with various characters', () => {
		const uri = 'at://did:web:example.com/collection/rkey';
		const result = parseAtUri(uri);

		expect(result).toEqual({
			did: 'did:web:example.com',
			collection: 'collection',
			rkey: 'rkey',
		});
	});
});

describe('resolveHandleToDid', () => {
	let mockClient: TangledApiClient;

	beforeEach(() => {
		mockClient = createMockClient();
	});

	it('should resolve handle to DID', async () => {
		const mockResolve = vi.fn().mockResolvedValue({
			data: { did: 'did:plc:abc123' },
		});

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		const result = await resolveHandleToDid('mark.bsky.social', mockClient);

		expect(result).toBe('did:plc:abc123');
		expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
	});

	it('should strip leading @ from handle', async () => {
		const mockResolve = vi.fn().mockResolvedValue({
			data: { did: 'did:plc:abc123' },
		});

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		await resolveHandleToDid('@mark.bsky.social', mockClient);

		expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
	});

	it('should throw error when handle not found', async () => {
		const mockResolve = vi.fn().mockResolvedValue({
			data: { did: null },
		});

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		await expect(
			resolveHandleToDid('nonexistent.bsky.social', mockClient),
		).rejects.toThrow('No DID found for handle: nonexistent.bsky.social');
	});

	it('should throw error on network failure', async () => {
		const mockResolve = vi
			.fn()
			.mockRejectedValue(new Error('Network error'));

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		await expect(
			resolveHandleToDid('mark.bsky.social', mockClient),
		).rejects.toThrow(
			"Failed to resolve handle 'mark.bsky.social': Network error",
		);
	});
});

describe('buildRepoAtUri', () => {
	let mockClient: TangledApiClient;

	beforeEach(() => {
		mockClient = createMockClient();
	});

	it('should build AT-URI from DID', async () => {
		const result = await buildRepoAtUri(
			'did:plc:abc123',
			'my-repo',
			mockClient,
		);

		expect(result).toBe('at://did:plc:abc123/sh.tangled.repo/my-repo');
	});

	it('should build AT-URI from handle', async () => {
		const mockResolve = vi.fn().mockResolvedValue({
			data: { did: 'did:plc:abc123' },
		});

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		const result = await buildRepoAtUri(
			'mark.bsky.social',
			'my-repo',
			mockClient,
		);

		expect(result).toBe('at://did:plc:abc123/sh.tangled.repo/my-repo');
		expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
	});

	it('should handle repository names with special characters', async () => {
		const result = await buildRepoAtUri(
			'did:plc:abc123',
			'repo-name_123',
			mockClient,
		);

		expect(result).toBe('at://did:plc:abc123/sh.tangled.repo/repo-name_123');
	});

	it('should throw error when handle resolution fails', async () => {
		const mockResolve = vi
			.fn()
			.mockRejectedValue(new Error('Resolution failed'));

		vi.mocked(mockClient.getAgent).mockReturnValue({
			com: {
				atproto: {
					identity: {
						resolveHandle: mockResolve,
					},
				},
			},
		} as never);

		await expect(
			buildRepoAtUri('mark.bsky.social', 'my-repo', mockClient),
		).rejects.toThrow(
			"Failed to resolve handle 'mark.bsky.social': Resolution failed",
		);
	});
});
