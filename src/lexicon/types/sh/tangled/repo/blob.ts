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
const id = 'sh.tangled.repo.blob'

export type QueryParams = {
  /** Repository identifier in format 'did:plc:.../repoName' */
  repo: string
  /** Git reference (branch, tag, or commit SHA) */
  ref: string
  /** Path to the file within the repository */
  path: string
  /** Return raw file content instead of JSON response */
  raw?: boolean
}
export type InputSchema = undefined

export interface OutputSchema {
  /** The git reference used */
  ref: string
  /** The file path */
  path: string
  /** File content (base64 encoded for binary files) */
  content?: string
  /** Content encoding */
  encoding?: 'utf-8' | 'base64'
  /** File size in bytes */
  size?: number
  /** Whether the file is binary */
  isBinary?: boolean
  /** MIME type of the file */
  mimeType?: string
  submodule?: Submodule
  lastCommit?: LastCommit
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

export class RefNotFoundError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class FileNotFoundError extends XRPCError {
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
    if (e.error === 'RefNotFound') return new RefNotFoundError(e)
    if (e.error === 'FileNotFound') return new FileNotFoundError(e)
    if (e.error === 'InvalidRequest') return new InvalidRequestError(e)
  }

  return e
}

export interface LastCommit {
  $type?: 'sh.tangled.repo.blob#lastCommit'
  /** Commit hash */
  hash: string
  /** Commit message */
  message: string
  author?: Signature
  /** Commit timestamp */
  when: string
}

const hashLastCommit = 'lastCommit'

export function isLastCommit<V>(v: V) {
  return is$typed(v, id, hashLastCommit)
}

export function validateLastCommit<V>(v: V) {
  return validate<LastCommit & V>(v, id, hashLastCommit)
}

export interface Signature {
  $type?: 'sh.tangled.repo.blob#signature'
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

export interface Submodule {
  $type?: 'sh.tangled.repo.blob#submodule'
  /** Submodule name */
  name: string
  /** Submodule repository URL */
  url: string
  /** Branch to track in the submodule */
  branch?: string
}

const hashSubmodule = 'submodule'

export function isSubmodule<V>(v: V) {
  return is$typed(v, id, hashSubmodule)
}

export function validateSubmodule<V>(v: V) {
  return validate<Submodule & V>(v, id, hashSubmodule)
}
