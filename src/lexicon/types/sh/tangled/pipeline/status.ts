/**
 * GENERATED CODE - DO NOT MODIFY
 */
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
const id = 'sh.tangled.pipeline.status'

export interface Main {
  $type: 'sh.tangled.pipeline.status'
  /** ATURI of the pipeline */
  pipeline: string
  /** name of the workflow within this pipeline */
  workflow: string
  /** status of the workflow */
  status: 'pending' | 'running' | 'failed' | 'timeout' | 'cancelled' | 'success'
  /** time of creation of this status update */
  createdAt: string
  /** error message if failed */
  error?: string
  /** exit code if failed */
  exitCode?: number
  [k: string]: unknown
}

const hashMain = 'main'

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain)
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain, true)
}

export {
  type Main as Record,
  isMain as isRecord,
  validateMain as validateRecord,
}
