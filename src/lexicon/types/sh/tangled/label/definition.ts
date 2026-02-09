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
const id = 'sh.tangled.label.definition'

export interface Main {
  $type: 'sh.tangled.label.definition'
  /** The display name of this label. */
  name: string
  valueType: ValueType
  /** The areas of the repo this label may apply to, eg.: sh.tangled.repo.issue. Appviews may choose to respect this. */
  scope: string[]
  /** The hex value for the background color for the label. Appviews may choose to respect this. */
  color?: string
  createdAt: string
  /** Whether this label can be repeated for a given entity, eg.: [reviewer:foo, reviewer:bar] */
  multiple?: boolean
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

export interface ValueType {
  $type?: 'sh.tangled.label.definition#valueType'
  /** The concrete type of this label's value. */
  type: 'null' | 'boolean' | 'integer' | 'string'
  /** An optional constraint that can be applied on string concrete types. */
  format: 'any' | 'did' | 'nsid'
  /** Closed set of values that this label can take. */
  enum?: string[]
}

const hashValueType = 'valueType'

export function isValueType<V>(v: V) {
  return is$typed(v, id, hashValueType)
}

export function validateValueType<V>(v: V) {
  return validate<ValueType & V>(v, id, hashValueType)
}
