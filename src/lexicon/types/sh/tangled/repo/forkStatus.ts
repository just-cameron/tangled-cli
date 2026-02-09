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
const id = 'sh.tangled.repo.forkStatus'

export type QueryParams = {}

export interface InputSchema {
  /** DID of the fork owner */
  did: string
  /** Name of the forked repository */
  name: string
  /** Source repository URL */
  source: string
  /** Branch to check status for */
  branch: string
  /** Hidden ref to use for comparison */
  hiddenRef: string
}

export interface OutputSchema {
  /** Fork status: 0=UpToDate, 1=FastForwardable, 2=Conflict, 3=MissingBranch */
  status: number
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
