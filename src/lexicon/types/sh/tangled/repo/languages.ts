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
const id = 'sh.tangled.repo.languages'

export type QueryParams = {
  /** Repository identifier in format 'did:plc:.../repoName' */
  repo: string
  /** Git reference (branch, tag, or commit SHA) */
  ref?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  /** The git reference used */
  ref: string
  languages: Language[]
  /** Total size of all analyzed files in bytes */
  totalSize?: number
  /** Total number of files analyzed */
  totalFiles?: number
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

export class InvalidRequestError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'RepoNotFound') return new RepoNotFoundError(e)
    if (e.error === 'RefNotFound') return new RefNotFoundError(e)
    if (e.error === 'InvalidRequest') return new InvalidRequestError(e)
  }

  return e
}

export interface Language {
  $type?: 'sh.tangled.repo.languages#language'
  /** Programming language name */
  name: string
  /** Total size of files in this language (bytes) */
  size: number
  /** Percentage of total codebase (0-100) */
  percentage: number
  /** Number of files in this language */
  fileCount?: number
  /** Hex color code for this language */
  color?: string
  /** File extensions associated with this language */
  extensions?: string[]
}

const hashLanguage = 'language'

export function isLanguage<V>(v: V) {
  return is$typed(v, id, hashLanguage)
}

export function validateLanguage<V>(v: V) {
  return validate<Language & V>(v, id, hashLanguage)
}
