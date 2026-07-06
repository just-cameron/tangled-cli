/**
 * GENERATED CODE - DO NOT MODIFY
 */
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
const id = 'sh.tangled.repo.artifact'

export interface Main {
  $type: 'sh.tangled.repo.artifact'
  /** name of the artifact */
  name: string
  /** repo that this artifact is being uploaded to */
  repo?: string
  repoDid?: string
  /** hash of the tag object that this artifact is attached to (only annotated tags are supported) */
  tag: Uint8Array
  /** time of creation of this artifact */
  createdAt: string
  /** the artifact */
  artifact: BlobRef
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
