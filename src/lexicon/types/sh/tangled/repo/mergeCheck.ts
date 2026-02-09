/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'sh.tangled.repo.mergeCheck'

export type QueryParams = {}

export interface InputSchema {
  /** DID of the repository owner */
  did: string
  /** Name of the repository */
  name: string
  /** Patch or pull request to check for merge conflicts */
  patch: string
  /** Target branch to merge into */
  branch: string
}

export interface OutputSchema {
  /** Whether the merge has conflicts */
  is_conflicted: boolean
  /** List of files with merge conflicts */
  conflicts?: ConflictInfo[]
  /** Additional message about the merge check */
  message?: string
  /** Error message if check failed */
  error?: string
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

export interface ConflictInfo {
  $type?: 'sh.tangled.repo.mergeCheck#conflictInfo'
  /** Name of the conflicted file */
  filename: string
  /** Reason for the conflict */
  reason: string
}

const hashConflictInfo = 'conflictInfo'

export function isConflictInfo<V>(v: V) {
  return is$typed(v, id, hashConflictInfo)
}

export function validateConflictInfo<V>(v: V) {
  return validate<ConflictInfo & V>(v, id, hashConflictInfo)
}
