const CONSTELLATION_BASE = 'https://constellation.microcosm.blue';

export interface ConstellationRecord {
  did: string;
  collection: string;
  rkey: string;
}

export interface GetBacklinksResult {
  total: number;
  records: ConstellationRecord[];
  cursor: string | null;
}

/**
 * Query the constellation indexer for records that link to a given AT-URI.
 * Constellation indexes records across all PDSs, enabling multi-collaborator queries.
 *
 * @param targetUri - The AT-URI being referenced by the records
 * @param collection - Filter results to this collection (e.g. 'sh.tangled.repo.issue')
 * @param path - The field path in each record that holds the target URI (e.g. '.repo')
 * @param limit - Max records to return (default 100)
 * @param cursor - Pagination cursor from a previous call
 */
export async function getBacklinks(
  targetUri: string,
  collection: string,
  path: string,
  limit = 100,
  cursor?: string
): Promise<GetBacklinksResult> {
  const params = new URLSearchParams({
    target: targetUri,
    collection,
    path,
    limit: String(limit),
  });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`${CONSTELLATION_BASE}/links?${params}`);
  if (!response.ok) {
    throw new Error(`Constellation API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    total: number;
    linking_records: ConstellationRecord[];
    cursor: string | null;
  };

  return {
    total: data.total,
    records: data.linking_records,
    cursor: data.cursor,
  };
}
