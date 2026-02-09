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
const id = 'sh.tangled.repo.getDefaultBranch'

export type QueryParams = {
  /** Repository identifier in format 'did:plc:.../repoName' */
  repo: string
}
export type InputSchema = undefined

export interface OutputSchema {
  /** Default branch name */
  name: string
  /** Latest commit hash on default branch */
  hash: string
  /** Short commit hash */
  shortHash?: string
  /** Timestamp of latest commit */
  when: string
  /** Latest commit message */
  message?: string
  author?: Signature
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export class RepoNotFoundError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidRequestError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'RepoNotFound') return new RepoNotFoundError(e)
    if (e.error === 'InvalidRequest') return new InvalidRequestError(e)
  }

  return e
}

export interface Signature {
  $type?: 'sh.tangled.repo.getDefaultBranch#signature'
  /** Author name */
  name: string
  /** Author email */
  email: string
  /** Author timestamp */
  when: string
}

const hashSignature = 'signature'

export function isSignature<V>(v: V) {
  return is$typed(v, id, hashSignature)
}

export function validateSignature<V>(v: V) {
  return validate<Signature & V>(v, id, hashSignature)
}
