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
const id = 'sh.tangled.actor.profile'

export interface Main {
  $type: 'sh.tangled.actor.profile'
  /** Small image to be displayed next to posts from account. AKA, 'profile picture' */
  avatar?: BlobRef
  /** Free-form profile description text. */
  description?: string
  links?: string[]
  stats?: (
    | 'merged-pull-request-count'
    | 'closed-pull-request-count'
    | 'open-pull-request-count'
    | 'open-issue-count'
    | 'closed-issue-count'
    | 'repository-count'
    | 'star-count'
  )[]
  /** Include link to this account on Bluesky. */
  bluesky: boolean
  /** Free-form location text. */
  location?: string
  /** Any ATURI, it is up to appviews to validate these fields. */
  pinnedRepositories?: string[]
  /** Preferred gender pronouns. */
  pronouns?: string
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
