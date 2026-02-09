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
const id = 'sh.tangled.repo.listSecrets'

export type QueryParams = {
  repo: string
}
export type InputSchema = undefined

export interface OutputSchema {
  secrets: Secret[]
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

export function toKnownErr(e: any) {
  return e
}

export interface Secret {
  $type?: 'sh.tangled.repo.listSecrets#secret'
  repo: string
  key: string
  createdAt: string
  createdBy: string
}

const hashSecret = 'secret'

export function isSecret<V>(v: V) {
  return is$typed(v, id, hashSecret)
}

export function validateSecret<V>(v: V) {
  return validate<Secret & V>(v, id, hashSecret)
}
