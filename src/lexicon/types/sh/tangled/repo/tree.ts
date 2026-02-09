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
const id = 'sh.tangled.repo.tree'

export type QueryParams = {
  /** Repository identifier in format 'did:plc:.../repoName' */
  repo: string
  /** Git reference (branch, tag, or commit SHA) */
  ref: string
  /** Path within the repository tree */
  path?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  /** The git reference used */
  ref: string
  /** The parent path in the tree */
  parent?: string
  /** Parent directory path */
  dotdot?: string
  readme?: Readme
  lastCommit?: LastCommit
  files: TreeEntry[]
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

export class PathNotFoundError extends XRPCError {
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
    if (e.error === 'PathNotFound') return new PathNotFoundError(e)
    if (e.error === 'InvalidRequest') return new InvalidRequestError(e)
  }

  return e
}

export interface Readme {
  $type?: 'sh.tangled.repo.tree#readme'
  /** Name of the readme file */
  filename: string
  /** Contents of the readme file */
  contents: string
}

const hashReadme = 'readme'

export function isReadme<V>(v: V) {
  return is$typed(v, id, hashReadme)
}

export function validateReadme<V>(v: V) {
  return validate<Readme & V>(v, id, hashReadme)
}

export interface TreeEntry {
  $type?: 'sh.tangled.repo.tree#treeEntry'
  /** Relative file or directory name */
  name: string
  /** File mode */
  mode: string
  /** File size in bytes */
  size: number
  last_commit?: LastCommit
}

const hashTreeEntry = 'treeEntry'

export function isTreeEntry<V>(v: V) {
  return is$typed(v, id, hashTreeEntry)
}

export function validateTreeEntry<V>(v: V) {
  return validate<TreeEntry & V>(v, id, hashTreeEntry)
}

export interface LastCommit {
  $type?: 'sh.tangled.repo.tree#lastCommit'
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
  $type?: 'sh.tangled.repo.tree#signature'
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
