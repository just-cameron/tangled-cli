/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'sh.tangled.pipeline'

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
  repo: string
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
  action: string
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
