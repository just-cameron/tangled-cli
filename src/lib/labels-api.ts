import { parseAtUri } from '../utils/at-uri.js';
import { requireAuth } from '../utils/auth-helpers.js';
import type { TangledApiClient } from './api-client.js';
import { getBacklinks } from './constellation.js';
import { getRecordFromDid, listAllRecordsFromDid } from './public-records.js';

/**
 * Label definition record (sh.tangled.label.definition)
 */
export interface LabelDefinition {
  uri: string;
  cid: string;
  name: string;
  color?: string;
  scope?: string[];
  multiple?: boolean;
  valueType?: {
    type: string;
    format?: string;
    enum?: string[];
  };
  createdAt?: string;
  author: string;
}

/**
 * Current label state for a subject (issue/PR AT-URI)
 */
export interface AppliedLabel {
  definitionUri: string;
  name: string;
  value: string;
}

interface LabelOpOperand {
  key: string;
  value: string;
}

interface LabelOpRecord {
  $type: 'sh.tangled.label.op';
  subject: string;
  add: LabelOpOperand[];
  delete: LabelOpOperand[];
  performedAt: string;
}

/**
 * List label definitions authored by a DID (defaults to the authenticated user).
 */
export async function listLabelDefinitions(
  client: TangledApiClient,
  repoDid?: string
): Promise<LabelDefinition[]> {
  const session = await requireAuth(client);
  const did = repoDid ?? session.did;

  const records = await listAllRecordsFromDid(client, did, 'sh.tangled.label.definition');

  return records.map((record) => {
    const value = record.value as {
      name?: string;
      color?: string;
      scope?: string[];
      multiple?: boolean;
      valueType?: LabelDefinition['valueType'];
      createdAt?: string;
    };
    return {
      uri: record.uri,
      cid: record.cid as string,
      name: value.name ?? parseAtUri(record.uri)?.rkey ?? 'unknown',
      color: value.color,
      scope: value.scope,
      multiple: value.multiple,
      valueType: value.valueType,
      createdAt: value.createdAt,
      author: did,
    };
  });
}

/**
 * Resolve a label name or AT-URI to a definition URI.
 * Searches the authenticated user's definitions first, then an optional owner DID.
 */
export async function resolveLabelDefinitionUri(
  client: TangledApiClient,
  nameOrUri: string,
  extraSearchDids: string[] = []
): Promise<{ uri: string; name: string }> {
  if (nameOrUri.startsWith('at://')) {
    const parsed = parseAtUri(nameOrUri);
    if (!parsed || parsed.collection !== 'sh.tangled.label.definition') {
      throw new Error(`Not a label definition AT-URI: ${nameOrUri}`);
    }
    return { uri: nameOrUri, name: parsed.rkey ?? nameOrUri };
  }

  const session = await requireAuth(client);
  const searchDids = Array.from(new Set([session.did, ...extraSearchDids]));

  for (const did of searchDids) {
    const defs = await listLabelDefinitions(client, did);
    const match = defs.find((d) => d.name.toLowerCase() === nameOrUri.toLowerCase());
    if (match) {
      return { uri: match.uri, name: match.name };
    }
  }

  throw new Error(
    `Label "${nameOrUri}" not found. Create it in Tangled repo settings, or pass a full at:// definition URI.`
  );
}

/**
 * Compute current labels on a subject by folding label.op records (add/delete).
 */
export async function getSubjectLabels(
  client: TangledApiClient,
  subjectUri: string
): Promise<AppliedLabel[]> {
  await requireAuth(client);

  // Prefer constellation backlinks (ops may live on any collaborator PDS).
  let opRefs: { did: string; collection: string; rkey: string }[] = [];
  try {
    const backlinks = await getBacklinks(subjectUri, 'sh.tangled.label.op', '.subject', 100);
    opRefs = backlinks.records;
  } catch {
    // Fall through to local PDS scan.
  }

  if (opRefs.length === 0) {
    const session = await requireAuth(client);
    const local = await client.getAgent().com.atproto.repo.listRecords({
      repo: session.did,
      collection: 'sh.tangled.label.op',
      limit: 100,
    });
    opRefs = local.data.records
      .filter((r) => (r.value as unknown as LabelOpRecord).subject === subjectUri)
      .map((r) => {
        const parsed = parseAtUri(r.uri);
        return {
          did: parsed?.did ?? session.did,
          collection: 'sh.tangled.label.op',
          rkey: parsed?.rkey ?? r.uri.split('/').pop() ?? r.uri,
        };
      });
  }

  const ops: { performedAt: string; add: LabelOpOperand[]; delete: LabelOpOperand[] }[] = [];
  for (const ref of opRefs) {
    const response = await getRecordFromDid(client, ref.did, ref.collection, ref.rkey);
    const value = response.data.value as unknown as LabelOpRecord;
    if (value.subject !== subjectUri) continue;
    ops.push({
      performedAt: value.performedAt,
      add: value.add ?? [],
      delete: value.delete ?? [],
    });
  }

  ops.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());

  const state = new Map<string, string>(); // definitionUri -> value
  for (const op of ops) {
    for (const operand of op.delete) {
      state.delete(operand.key);
    }
    for (const operand of op.add) {
      state.set(operand.key, operand.value ?? '');
    }
  }

  const applied: AppliedLabel[] = [];
  for (const [definitionUri, value] of state) {
    const parsed = parseAtUri(definitionUri);
    let name = parsed?.rkey ?? definitionUri;
    if (parsed?.did) {
      try {
        const defs = await listLabelDefinitions(client, parsed.did);
        const match = defs.find((d) => d.uri === definitionUri);
        if (match) name = match.name;
      } catch {
        // keep rkey fallback
      }
    }
    applied.push({ definitionUri, name, value });
  }

  return applied;
}

export interface ApplyLabelParams {
  client: TangledApiClient;
  subjectUri: string;
  addNamesOrUris?: string[];
  removeNamesOrUris?: string[];
  /** Extra DIDs to search when resolving label names */
  searchDids?: string[];
}

/**
 * Apply a label.op that adds and/or removes labels on a subject.
 * Mutual exclusivity for decision-* labels is the caller's responsibility
 * (pass both add and remove).
 */
export async function applyLabelOp(
  params: ApplyLabelParams
): Promise<{ uri: string; cid: string }> {
  const {
    client,
    subjectUri,
    addNamesOrUris = [],
    removeNamesOrUris = [],
    searchDids = [],
  } = params;
  const session = await requireAuth(client);

  if (addNamesOrUris.length === 0 && removeNamesOrUris.length === 0) {
    throw new Error('Nothing to add or remove');
  }

  const add: LabelOpOperand[] = [];
  for (const name of addNamesOrUris) {
    const resolved = await resolveLabelDefinitionUri(client, name, searchDids);
    add.push({ key: resolved.uri, value: '' });
  }

  const del: LabelOpOperand[] = [];
  for (const name of removeNamesOrUris) {
    const resolved = await resolveLabelDefinitionUri(client, name, searchDids);
    del.push({ key: resolved.uri, value: '' });
  }

  const record: LabelOpRecord = {
    $type: 'sh.tangled.label.op',
    subject: subjectUri,
    add,
    delete: del,
    performedAt: new Date().toISOString(),
  };

  const response = await client.getAgent().com.atproto.repo.createRecord({
    repo: session.did,
    collection: 'sh.tangled.label.op',
    record: record as unknown as { [x: string]: unknown },
  });

  return { uri: response.data.uri, cid: response.data.cid };
}
