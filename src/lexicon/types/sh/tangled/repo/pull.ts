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
const id = 'sh.tangled.repo.pull'

export interface Main {
  $type: 'sh.tangled.repo.pull'
  target: Target
  title: string
  body?: string
  /** (deprecated) use patchBlob instead */
  patch?: string
  /** patch content */
  patchBlob: BlobRef
  source?: Source
  createdAt: string
  mentions?: string[]
  references?: string[]
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

export interface Target {
  $type?: 'sh.tangled.repo.pull#target'
  repo: string
  branch: string
}

const hashTarget = 'target'

export function isTarget<V>(v: V) {
  return is$typed(v, id, hashTarget)
}

export function validateTarget<V>(v: V) {
  return validate<Target & V>(v, id, hashTarget)
}

export interface Source {
  $type?: 'sh.tangled.repo.pull#source'
  branch: string
  sha: string
  repo?: string
}

const hashSource = 'source'

export function isSource<V>(v: V) {
  return is$typed(v, id, hashSource)
}

export function validateSource<V>(v: V) {
  return validate<Source & V>(v, id, hashSource)
}
