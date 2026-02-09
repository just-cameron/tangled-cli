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
const id = 'sh.tangled.repo.compare'

export type QueryParams = {
  /** Repository identifier in format 'did:plc:.../repoName' */
  repo: string
  /** First revision (commit, branch, or tag) */
  rev1: string
  /** Second revision (commit, branch, or tag) */
  rev2: string
}
export type InputSchema = undefined

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: Uint8Array
}

export class RepoNotFoundError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class RevisionNotFoundError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidRequestError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class CompareError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'RepoNotFound') return new RepoNotFoundError(e)
    if (e.error === 'RevisionNotFound') return new RevisionNotFoundError(e)
    if (e.error === 'InvalidRequest') return new InvalidRequestError(e)
    if (e.error === 'CompareError') return new CompareError(e)
  }

  return e
}
