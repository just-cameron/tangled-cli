import { parseAtUri } from '../utils/at-uri.js';
import type { TangledApiClient } from './api-client.js';
import { getIssue, type IssueWithMetadata, listIssues } from './issues-api.js';
import { listAllRecordsFromDid } from './public-records.js';
import { getPull, listPulls, type PullWithMetadata } from './pulls-api.js';

export type AddressKind = 'issue' | 'pull';

export interface AddressResolution {
  kind: AddressKind;
  uri: string;
  rkey: string;
  computedNumber?: number;
  selectorKind: 'at-uri' | 'tangled-url' | 'rkey' | 'rkey-prefix' | 'computed-number';
  warning?: string;
}

function compareEntities(
  a: { createdAt: string; uri: string },
  b: { createdAt: string; uri: string }
): number {
  const byTime = a.createdAt.localeCompare(b.createdAt);
  return byTime !== 0 ? byTime : a.uri.localeCompare(b.uri);
}

export function sortIssues(issues: IssueWithMetadata[]): IssueWithMetadata[] {
  return [...issues].sort(compareEntities);
}

export function sortPulls(pulls: PullWithMetadata[]): PullWithMetadata[] {
  return [...pulls].sort(compareEntities);
}

export async function listAllIssues(
  client: TangledApiClient,
  repoDid: string,
  repoAliases: string[] = []
): Promise<IssueWithMetadata[]> {
  const byUri = new Map<string, IssueWithMetadata>();
  let cursor: string | undefined;
  do {
    const page = await listIssues({ client, repoDid, repoAliases, limit: 100, cursor });
    for (const issue of page.issues) byUri.set(issue.uri, issue);
    cursor = page.cursor;
  } while (cursor);

  // Legacy clients sometimes wrote a repository record AT-URI into `.repo`
  // instead of its stable DID. Those records cannot share Constellation's
  // canonical cursor without breaking page limits, so include the signed-in
  // author's aliases only in the explicit all-pages/address-resolution path.
  const session = client.getSession?.();
  if (session && repoAliases.length > 0) {
    const accepted = new Set([repoDid, ...repoAliases]);
    const local = await listAllRecordsFromDid(client, session.did, 'sh.tangled.repo.issue');
    for (const record of local) {
      const value = record.value as import('./issues-api.js').IssueRecord;
      if (!accepted.has(value.repo) || byUri.has(record.uri)) continue;
      byUri.set(record.uri, {
        ...value,
        uri: record.uri,
        cid: record.cid as string,
        author: session.did,
      });
    }
  }
  return sortIssues([...byUri.values()]);
}

export async function listAllPulls(
  client: TangledApiClient,
  repoDid: string
): Promise<PullWithMetadata[]> {
  const byUri = new Map<string, PullWithMetadata>();
  let cursor: string | undefined;
  do {
    const page = await listPulls({ client, repoDid, limit: 100, cursor });
    for (const pull of page.pulls) byUri.set(pull.uri, pull);
    cursor = page.cursor;
  } while (cursor);
  return sortPulls([...byUri.values()]);
}

function selectorFromUrl(input: string, kind: AddressKind): string | undefined {
  if (!/^https?:\/\//.test(input)) return undefined;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return undefined;
  }
  if (url.hostname !== 'tangled.org' && url.hostname !== 'tangled.sh') return undefined;
  const segment = kind === 'issue' ? 'issues' : 'pulls';
  const parts = url.pathname.split('/').filter(Boolean);
  const index = parts.indexOf(segment);
  return index >= 0 ? parts[index + 1] : undefined;
}

function exactRkey(uri: string): string {
  return uri.split('/').pop() ?? uri;
}

function computedWarning(kind: AddressKind): string {
  const label = kind === 'issue' ? 'issue' : 'pull request';
  return `Numeric ${label} IDs are appview display addresses. This CLI resolved the number from deterministic record order; prefer the returned AT-URI or rkey for durable automation.`;
}

/**
 * Resolve an issue or pull selector across every Constellation page and every
 * author PDS. AT-URIs and exact rkeys are authoritative. Numeric selectors are
 * explicitly marked as deterministic display-number fallbacks.
 */
export async function resolveEntityAddress(params: {
  kind: AddressKind;
  input: string;
  client: TangledApiClient;
  repoDid: string;
  repoAliases?: string[];
}): Promise<AddressResolution> {
  const { kind, client, repoDid, repoAliases = [] } = params;
  const fromUrl = selectorFromUrl(params.input, kind);
  const input = (fromUrl ?? params.input).replace(/^#/, '').trim();
  const expectedCollection = kind === 'issue' ? 'sh.tangled.repo.issue' : 'sh.tangled.repo.pull';

  const parsed = parseAtUri(input);
  if (parsed?.rkey) {
    if (parsed.collection !== expectedCollection) {
      throw new Error(`Expected a ${kind} AT-URI, received collection ${parsed.collection}`);
    }
    if (kind === 'issue') {
      const issue = await getIssue({ client, issueUri: input });
      if (issue.repo !== repoDid && !repoAliases.includes(issue.repo)) {
        throw new Error(`Issue ${input} does not belong to repository ${repoDid}`);
      }
    } else {
      const pull = await getPull({ client, pullUri: input });
      if (pull.target.repo !== repoDid && pull.target.repoDid !== repoDid) {
        throw new Error(`Pull request ${input} does not belong to repository ${repoDid}`);
      }
    }
    return {
      kind,
      uri: input,
      rkey: parsed.rkey,
      selectorKind: 'at-uri',
    };
  }

  const entities =
    kind === 'issue'
      ? await listAllIssues(client, repoDid, repoAliases)
      : await listAllPulls(client, repoDid);

  if (/^\d+$/.test(input)) {
    const number = Number.parseInt(input, 10);
    const entity = entities[number - 1];
    if (!entity)
      throw new Error(`${kind === 'issue' ? 'Issue' : 'Pull request'} #${number} not found`);
    return {
      kind,
      uri: entity.uri,
      rkey: exactRkey(entity.uri),
      computedNumber: number,
      selectorKind: fromUrl ? 'tangled-url' : 'computed-number',
      warning: computedWarning(kind),
    };
  }

  const exact = entities.find((entity) => exactRkey(entity.uri) === input);
  if (exact) {
    return { kind, uri: exact.uri, rkey: input, selectorKind: 'rkey' };
  }

  const prefix = entities.filter((entity) => exactRkey(entity.uri).startsWith(input));
  if (prefix.length === 1) {
    return {
      kind,
      uri: prefix[0].uri,
      rkey: exactRkey(prefix[0].uri),
      selectorKind: 'rkey-prefix',
    };
  }
  if (prefix.length > 1) {
    throw new Error(
      `Ambiguous ${kind} rkey prefix '${input}': ${prefix
        .slice(0, 8)
        .map((entity) => exactRkey(entity.uri))
        .join(', ')}`
    );
  }
  throw new Error(`${kind === 'issue' ? 'Issue' : 'Pull request'} '${params.input}' not found`);
}

export const ADDRESSING_NOTE =
  'Numbers are display-only fallback addresses; use AT-URI or rkey for durable automation.';
