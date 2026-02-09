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
const id = 'sh.tangled.repo.merge'

export type QueryParams = {}

export interface InputSchema {
  /** DID of the repository owner */
  did: string
  /** Name of the repository */
  name: string
  /** Patch content to merge */
  patch: string
  /** Target branch to merge into */
  branch: string
  /** Author name for the merge commit */
  authorName?: string
  /** Author email for the merge commit */
  authorEmail?: string
  /** Additional commit message body */
  commitBody?: string
  /** Merge commit message */
  commitMessage?: string
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
}

export function toKnownErr(e: any) {
  return e
}
