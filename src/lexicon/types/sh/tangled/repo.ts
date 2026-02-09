/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats'
import { validate as _validate } from '../../../lexicons.js'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'sh.tangled.repo'

export interface Main {
  $type: 'sh.tangled.repo'
  /** name of the repo */
  name: string
  /** knot where the repo was created */
  knot: string
  /** CI runner to send jobs to and receive results from */
  spindle?: string
  description?: string
  /** Any URI related to the repo */
  website?: string
  /** Topics related to the repo */
  topics?: string[]
  /** source of the repo */
  source?: string
  /** List of labels that this repo subscribes to */
  labels?: string[]
  createdAt: string
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
