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
const id = 'sh.tangled.label.op'

export interface Main {
  $type: 'sh.tangled.label.op'
  /** The subject (task, pull or discussion) of this label. Appviews may apply a `scope` check and refuse this op. */
  subject: string
  performedAt: string
  add: Operand[]
  delete: Operand[]
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

export interface Operand {
  $type?: 'sh.tangled.label.op#operand'
  /** ATURI to the label definition */
  key: string
  /** Stringified value of the label. This is first unstringed by appviews and then interpreted as a concrete value. */
  value: string
}

const hashOperand = 'operand'

export function isOperand<V>(v: V) {
  return is$typed(v, id, hashOperand)
}

export function validateOperand<V>(v: V) {
  return validate<Operand & V>(v, id, hashOperand)
}
