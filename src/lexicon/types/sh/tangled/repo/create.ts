/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats'
import { validate as _validate } from '../../../../lexicons.js'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'sh.tangled.repo.create'

export type QueryParams = {}

export interface InputSchema {
  /** Rkey of the repository record */
  rkey: string
  /** Name of the repository */
  name: string
  /** Default branch to push to */
  defaultBranch?: string
  /** A source URL to clone from, populate this when forking or importing a repository. */
  source?: string
  /** Optional user-provided did:web to use as the repo identity instead of minting a did:plc. */
  repoDid?: string
}

export interface OutputSchema {
  repoDid?: string
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
