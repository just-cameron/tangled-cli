/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats'
import { validate as _validate } from '../../../lexicons.js'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'sh.tangled.pipeline'

/** DEPRECATED: use sh.tangled.ci.pipeline instead */
export interface Main {
  $type: 'sh.tangled.pipeline'
  triggerMetadata: TriggerMetadata
  workflows: Workflow[]
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

export interface TriggerMetadata {
  $type?: 'sh.tangled.pipeline#triggerMetadata'
  kind: 'push' | 'pull_request' | 'manual'
  repo: TriggerRepo
  push?: PushTriggerData
  pullRequest?: PullRequestTriggerData
  manual?: ManualTriggerData
  /** Repository DID that code and workflow definitions are checked out from, when different from repo (e.g. a fork's commit for a fork-based manual trigger). If absent, source uses repo itself. */
  sourceRepo?: string
}

const hashTriggerMetadata = 'triggerMetadata'

export function isTriggerMetadata<V>(v: V) {
  return is$typed(v, id, hashTriggerMetadata)
}

export function validateTriggerMetadata<V>(v: V) {
  return validate<TriggerMetadata & V>(v, id, hashTriggerMetadata)
}

export interface TriggerRepo {
  $type?: 'sh.tangled.pipeline#triggerRepo'
  knot: string
  did: string
  /** DID of the repo itself */
  repoDid?: string
  repo?: string
  defaultBranch: string
}

const hashTriggerRepo = 'triggerRepo'

export function isTriggerRepo<V>(v: V) {
  return is$typed(v, id, hashTriggerRepo)
}

export function validateTriggerRepo<V>(v: V) {
  return validate<TriggerRepo & V>(v, id, hashTriggerRepo)
}

export interface PushTriggerData {
  $type?: 'sh.tangled.pipeline#pushTriggerData'
  ref: string
  newSha: string
  oldSha: string
}

const hashPushTriggerData = 'pushTriggerData'

export function isPushTriggerData<V>(v: V) {
  return is$typed(v, id, hashPushTriggerData)
}

export function validatePushTriggerData<V>(v: V) {
  return validate<PushTriggerData & V>(v, id, hashPushTriggerData)
}

export interface PullRequestTriggerData {
  $type?: 'sh.tangled.pipeline#pullRequestTriggerData'
  sourceBranch: string
  targetBranch: string
  sourceSha: string
  /** AT-URI of the sh.tangled.repo.pull record this run belongs to */
  pull?: string
}

const hashPullRequestTriggerData = 'pullRequestTriggerData'

export function isPullRequestTriggerData<V>(v: V) {
  return is$typed(v, id, hashPullRequestTriggerData)
}

export function validatePullRequestTriggerData<V>(v: V) {
  return validate<PullRequestTriggerData & V>(v, id, hashPullRequestTriggerData)
}

export interface ManualTriggerData {
  $type?: 'sh.tangled.pipeline#manualTriggerData'
  /** commit SHA the manual run targets */
  sha: string
  /** optional ref the SHA was resolved from, for display and TANGLED_REF */
  ref?: string
  inputs?: Pair[]
}

const hashManualTriggerData = 'manualTriggerData'

export function isManualTriggerData<V>(v: V) {
  return is$typed(v, id, hashManualTriggerData)
}

export function validateManualTriggerData<V>(v: V) {
  return validate<ManualTriggerData & V>(v, id, hashManualTriggerData)
}

export interface Workflow {
  $type?: 'sh.tangled.pipeline#workflow'
  name: string
  engine: string
  clone: CloneOpts
  raw: string
}

const hashWorkflow = 'workflow'

export function isWorkflow<V>(v: V) {
  return is$typed(v, id, hashWorkflow)
}

export function validateWorkflow<V>(v: V) {
  return validate<Workflow & V>(v, id, hashWorkflow)
}

export interface CloneOpts {
  $type?: 'sh.tangled.pipeline#cloneOpts'
  skip: boolean
  depth: number
  submodules: boolean
  tags: boolean
}

const hashCloneOpts = 'cloneOpts'

export function isCloneOpts<V>(v: V) {
  return is$typed(v, id, hashCloneOpts)
}

export function validateCloneOpts<V>(v: V) {
  return validate<CloneOpts & V>(v, id, hashCloneOpts)
}

export interface Pair {
  $type?: 'sh.tangled.pipeline#pair'
  key: string
  value: string
}

const hashPair = 'pair'

export function isPair<V>(v: V) {
  return is$typed(v, id, hashPair)
}

export function validatePair<V>(v: V) {
  return validate<Pair & V>(v, id, hashPair)
}
