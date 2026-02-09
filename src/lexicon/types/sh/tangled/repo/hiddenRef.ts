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
const id = 'sh.tangled.repo.hiddenRef'

export type QueryParams = {}

export interface InputSchema {
  /** AT-URI of the repository */
  repo: string
  /** Fork reference name */
  forkRef: string
  /** Remote reference name */
  remoteRef: string
}

export interface OutputSchema {
  /** Whether the hidden ref was created successfully */
  success: boolean
  /** The created hidden ref name */
  ref?: string
  /** Error message if creation failed */
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
