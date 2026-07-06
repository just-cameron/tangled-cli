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
const id = 'sh.tangled.git.refUpdate'

export interface Main {
  $type: 'sh.tangled.git.refUpdate'
  /** Ref being updated */
  ref: string
  /** did of the user that pushed this ref */
  committerDid: string
  /** did of the owner of the repo */
  ownerDid?: string
  /** DID of the repo itself */
  repo: string
  /** old SHA of this ref */
  oldSha: string
  /** new SHA of this ref */
  newSha: string
  /** files changed between commits */
  changedFiles?: string[]
  /** push options passed on git-push */
  pushOptions?: (
    | 'ci-skip'
    | 'ci-verbose'
    | 'skip-ci'
    | 'verbose-ci'
    | (string & {})
  )[]
  meta: Meta
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

export interface Meta {
  $type?: 'sh.tangled.git.refUpdate#meta'
  isDefaultRef: boolean
  langBreakdown?: LangBreakdown
  commitCount: CommitCountBreakdown
}

const hashMeta = 'meta'

export function isMeta<V>(v: V) {
  return is$typed(v, id, hashMeta)
}

export function validateMeta<V>(v: V) {
  return validate<Meta & V>(v, id, hashMeta)
}

export interface LangBreakdown {
  $type?: 'sh.tangled.git.refUpdate#langBreakdown'
  inputs?: IndividualLanguageSize[]
}

const hashLangBreakdown = 'langBreakdown'

export function isLangBreakdown<V>(v: V) {
  return is$typed(v, id, hashLangBreakdown)
}

export function validateLangBreakdown<V>(v: V) {
  return validate<LangBreakdown & V>(v, id, hashLangBreakdown)
}

export interface IndividualLanguageSize {
  $type?: 'sh.tangled.git.refUpdate#individualLanguageSize'
  lang: string
  size: number
}

const hashIndividualLanguageSize = 'individualLanguageSize'

export function isIndividualLanguageSize<V>(v: V) {
  return is$typed(v, id, hashIndividualLanguageSize)
}

export function validateIndividualLanguageSize<V>(v: V) {
  return validate<IndividualLanguageSize & V>(v, id, hashIndividualLanguageSize)
}

export interface CommitCountBreakdown {
  $type?: 'sh.tangled.git.refUpdate#commitCountBreakdown'
  byEmail?: IndividualEmailCommitCount[]
}

const hashCommitCountBreakdown = 'commitCountBreakdown'

export function isCommitCountBreakdown<V>(v: V) {
  return is$typed(v, id, hashCommitCountBreakdown)
}

export function validateCommitCountBreakdown<V>(v: V) {
  return validate<CommitCountBreakdown & V>(v, id, hashCommitCountBreakdown)
}

export interface IndividualEmailCommitCount {
  $type?: 'sh.tangled.git.refUpdate#individualEmailCommitCount'
  email: string
  count: number
}

const hashIndividualEmailCommitCount = 'individualEmailCommitCount'

export function isIndividualEmailCommitCount<V>(v: V) {
  return is$typed(v, id, hashIndividualEmailCommitCount)
}

export function validateIndividualEmailCommitCount<V>(v: V) {
  return validate<IndividualEmailCommitCount & V>(
    v,
    id,
    hashIndividualEmailCommitCount,
  )
}
