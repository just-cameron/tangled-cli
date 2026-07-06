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
const id = 'sh.tangled.feed.star'

export interface Main {
  $type: 'sh.tangled.feed.star'
  subject: $Typed<Repo> | $Typed<String>
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

export interface Repo {
  $type?: 'sh.tangled.feed.star#repo'
  did: string
}

const hashRepo = 'repo'

export function isRepo<V>(v: V) {
  return is$typed(v, id, hashRepo)
}

export function validateRepo<V>(v: V) {
  return validate<Repo & V>(v, id, hashRepo)
}

export interface String {
  $type?: 'sh.tangled.feed.star#string'
  uri: string
}

const hashString = 'string'

export function isString<V>(v: V) {
  return is$typed(v, id, hashString)
}

export function validateString<V>(v: V) {
  return validate<String & V>(v, id, hashString)
}
