/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  XrpcClient,
  type FetchHandler,
  type FetchHandlerOptions,
} from '@atproto/xrpc'
import { schemas } from './lexicons.js'
import { CID } from 'multiformats/cid'
import { type OmitKey, type Un$Typed } from './util.js'
import * as ShTangledActorProfile from './types/sh/tangled/actor/profile.js'
import * as ShTangledFeedReaction from './types/sh/tangled/feed/reaction.js'
import * as ShTangledFeedStar from './types/sh/tangled/feed/star.js'
import * as ShTangledGitRefUpdate from './types/sh/tangled/git/refUpdate.js'
import * as ShTangledGraphFollow from './types/sh/tangled/graph/follow.js'
import * as ShTangledRepoIssueStateClosed from './types/sh/tangled/repo/issue/state/closed.js'
import * as ShTangledRepoIssueComment from './types/sh/tangled/repo/issue/comment.js'
import * as ShTangledRepoIssue from './types/sh/tangled/repo/issue.js'
import * as ShTangledRepoIssueStateOpen from './types/sh/tangled/repo/issue/state/open.js'
import * as ShTangledRepoIssueState from './types/sh/tangled/repo/issue/state.js'
import * as ShTangledKnot from './types/sh/tangled/knot.js'
import * as ShTangledKnotListKeys from './types/sh/tangled/knot/listKeys.js'
import * as ShTangledKnotMember from './types/sh/tangled/knot/member.js'
import * as ShTangledKnotVersion from './types/sh/tangled/knot/version.js'
import * as ShTangledLabelDefinition from './types/sh/tangled/label/definition.js'
import * as ShTangledLabelOp from './types/sh/tangled/label/op.js'
import * as ShTangledPipelineCancelPipeline from './types/sh/tangled/pipeline/cancelPipeline.js'
import * as ShTangledPipeline from './types/sh/tangled/pipeline.js'
import * as ShTangledPipelineStatus from './types/sh/tangled/pipeline/status.js'
import * as ShTangledRepoPullStatusClosed from './types/sh/tangled/repo/pull/status/closed.js'
import * as ShTangledRepoPullComment from './types/sh/tangled/repo/pull/comment.js'
import * as ShTangledRepoPullStatusMerged from './types/sh/tangled/repo/pull/status/merged.js'
import * as ShTangledRepoPullStatusOpen from './types/sh/tangled/repo/pull/status/open.js'
import * as ShTangledRepoPull from './types/sh/tangled/repo/pull.js'
import * as ShTangledRepoPullStatus from './types/sh/tangled/repo/pull/status.js'
import * as ShTangledRepoAddSecret from './types/sh/tangled/repo/addSecret.js'
import * as ShTangledRepoArchive from './types/sh/tangled/repo/archive.js'
import * as ShTangledRepoArtifact from './types/sh/tangled/repo/artifact.js'
import * as ShTangledRepoBlob from './types/sh/tangled/repo/blob.js'
import * as ShTangledRepoBranch from './types/sh/tangled/repo/branch.js'
import * as ShTangledRepoBranches from './types/sh/tangled/repo/branches.js'
import * as ShTangledRepoCollaborator from './types/sh/tangled/repo/collaborator.js'
import * as ShTangledRepoCompare from './types/sh/tangled/repo/compare.js'
import * as ShTangledRepoCreate from './types/sh/tangled/repo/create.js'
import * as ShTangledRepoSetDefaultBranch from './types/sh/tangled/repo/setDefaultBranch.js'
import * as ShTangledRepoDelete from './types/sh/tangled/repo/delete.js'
import * as ShTangledRepoDeleteBranch from './types/sh/tangled/repo/deleteBranch.js'
import * as ShTangledRepoDiff from './types/sh/tangled/repo/diff.js'
import * as ShTangledRepoForkStatus from './types/sh/tangled/repo/forkStatus.js'
import * as ShTangledRepoForkSync from './types/sh/tangled/repo/forkSync.js'
import * as ShTangledRepoGetDefaultBranch from './types/sh/tangled/repo/getDefaultBranch.js'
import * as ShTangledRepoHiddenRef from './types/sh/tangled/repo/hiddenRef.js'
import * as ShTangledRepoLanguages from './types/sh/tangled/repo/languages.js'
import * as ShTangledRepoListSecrets from './types/sh/tangled/repo/listSecrets.js'
import * as ShTangledRepoLog from './types/sh/tangled/repo/log.js'
import * as ShTangledRepoMerge from './types/sh/tangled/repo/merge.js'
import * as ShTangledRepoMergeCheck from './types/sh/tangled/repo/mergeCheck.js'
import * as ShTangledRepoRemoveSecret from './types/sh/tangled/repo/removeSecret.js'
import * as ShTangledRepo from './types/sh/tangled/repo.js'
import * as ShTangledRepoTag from './types/sh/tangled/repo/tag.js'
import * as ShTangledRepoTags from './types/sh/tangled/repo/tags.js'
import * as ShTangledRepoTree from './types/sh/tangled/repo/tree.js'
import * as ShTangledSpindleMember from './types/sh/tangled/spindle/member.js'
import * as ShTangledSpindle from './types/sh/tangled/spindle.js'
import * as ShTangledString from './types/sh/tangled/string.js'

export * as ShTangledActorProfile from './types/sh/tangled/actor/profile.js'
export * as ShTangledFeedReaction from './types/sh/tangled/feed/reaction.js'
export * as ShTangledFeedStar from './types/sh/tangled/feed/star.js'
export * as ShTangledGitRefUpdate from './types/sh/tangled/git/refUpdate.js'
export * as ShTangledGraphFollow from './types/sh/tangled/graph/follow.js'
export * as ShTangledRepoIssueStateClosed from './types/sh/tangled/repo/issue/state/closed.js'
export * as ShTangledRepoIssueComment from './types/sh/tangled/repo/issue/comment.js'
export * as ShTangledRepoIssue from './types/sh/tangled/repo/issue.js'
export * as ShTangledRepoIssueStateOpen from './types/sh/tangled/repo/issue/state/open.js'
export * as ShTangledRepoIssueState from './types/sh/tangled/repo/issue/state.js'
export * as ShTangledKnot from './types/sh/tangled/knot.js'
export * as ShTangledKnotListKeys from './types/sh/tangled/knot/listKeys.js'
export * as ShTangledKnotMember from './types/sh/tangled/knot/member.js'
export * as ShTangledKnotVersion from './types/sh/tangled/knot/version.js'
export * as ShTangledLabelDefinition from './types/sh/tangled/label/definition.js'
export * as ShTangledLabelOp from './types/sh/tangled/label/op.js'
export * as ShTangledPipelineCancelPipeline from './types/sh/tangled/pipeline/cancelPipeline.js'
export * as ShTangledPipeline from './types/sh/tangled/pipeline.js'
export * as ShTangledPipelineStatus from './types/sh/tangled/pipeline/status.js'
export * as ShTangledRepoPullStatusClosed from './types/sh/tangled/repo/pull/status/closed.js'
export * as ShTangledRepoPullComment from './types/sh/tangled/repo/pull/comment.js'
export * as ShTangledRepoPullStatusMerged from './types/sh/tangled/repo/pull/status/merged.js'
export * as ShTangledRepoPullStatusOpen from './types/sh/tangled/repo/pull/status/open.js'
export * as ShTangledRepoPull from './types/sh/tangled/repo/pull.js'
export * as ShTangledRepoPullStatus from './types/sh/tangled/repo/pull/status.js'
export * as ShTangledRepoAddSecret from './types/sh/tangled/repo/addSecret.js'
export * as ShTangledRepoArchive from './types/sh/tangled/repo/archive.js'
export * as ShTangledRepoArtifact from './types/sh/tangled/repo/artifact.js'
export * as ShTangledRepoBlob from './types/sh/tangled/repo/blob.js'
export * as ShTangledRepoBranch from './types/sh/tangled/repo/branch.js'
export * as ShTangledRepoBranches from './types/sh/tangled/repo/branches.js'
export * as ShTangledRepoCollaborator from './types/sh/tangled/repo/collaborator.js'
export * as ShTangledRepoCompare from './types/sh/tangled/repo/compare.js'
export * as ShTangledRepoCreate from './types/sh/tangled/repo/create.js'
export * as ShTangledRepoSetDefaultBranch from './types/sh/tangled/repo/setDefaultBranch.js'
export * as ShTangledRepoDelete from './types/sh/tangled/repo/delete.js'
export * as ShTangledRepoDeleteBranch from './types/sh/tangled/repo/deleteBranch.js'
export * as ShTangledRepoDiff from './types/sh/tangled/repo/diff.js'
export * as ShTangledRepoForkStatus from './types/sh/tangled/repo/forkStatus.js'
export * as ShTangledRepoForkSync from './types/sh/tangled/repo/forkSync.js'
export * as ShTangledRepoGetDefaultBranch from './types/sh/tangled/repo/getDefaultBranch.js'
export * as ShTangledRepoHiddenRef from './types/sh/tangled/repo/hiddenRef.js'
export * as ShTangledRepoLanguages from './types/sh/tangled/repo/languages.js'
export * as ShTangledRepoListSecrets from './types/sh/tangled/repo/listSecrets.js'
export * as ShTangledRepoLog from './types/sh/tangled/repo/log.js'
export * as ShTangledRepoMerge from './types/sh/tangled/repo/merge.js'
export * as ShTangledRepoMergeCheck from './types/sh/tangled/repo/mergeCheck.js'
export * as ShTangledRepoRemoveSecret from './types/sh/tangled/repo/removeSecret.js'
export * as ShTangledRepo from './types/sh/tangled/repo.js'
export * as ShTangledRepoTag from './types/sh/tangled/repo/tag.js'
export * as ShTangledRepoTags from './types/sh/tangled/repo/tags.js'
export * as ShTangledRepoTree from './types/sh/tangled/repo/tree.js'
export * as ShTangledSpindleMember from './types/sh/tangled/spindle/member.js'
export * as ShTangledSpindle from './types/sh/tangled/spindle.js'
export * as ShTangledString from './types/sh/tangled/string.js'

export const SH_TANGLED_REPO_ISSUE_STATE = {
  Closed: 'sh.tangled.repo.issue.state.closed',
  Open: 'sh.tangled.repo.issue.state.open',
}
export const SH_TANGLED_REPO_PULL_STATUS = {
  Closed: 'sh.tangled.repo.pull.status.closed',
  Merged: 'sh.tangled.repo.pull.status.merged',
  Open: 'sh.tangled.repo.pull.status.open',
}

export class AtpBaseClient extends XrpcClient {
  sh: ShNS

  constructor(options: FetchHandler | FetchHandlerOptions) {
    super(options, schemas)
    this.sh = new ShNS(this)
  }

  /** @deprecated use `this` instead */
  get xrpc(): XrpcClient {
    return this
  }
}

export class ShNS {
  _client: XrpcClient
  tangled: ShTangledNS

  constructor(client: XrpcClient) {
    this._client = client
    this.tangled = new ShTangledNS(client)
  }
}

export class ShTangledNS {
  _client: XrpcClient
  knot: ShTangledKnotRecord
  pipeline: ShTangledPipelineRecord
  repo: ShTangledRepoRecord
  spindle: ShTangledSpindleRecord
  string: ShTangledStringRecord
  actor: ShTangledActorNS
  feed: ShTangledFeedNS
  git: ShTangledGitNS
  graph: ShTangledGraphNS
  repo: ShTangledRepoNS
  knot: ShTangledKnotNS
  label: ShTangledLabelNS
  pipeline: ShTangledPipelineNS
  spindle: ShTangledSpindleNS

  constructor(client: XrpcClient) {
    this._client = client
    this.actor = new ShTangledActorNS(client)
    this.feed = new ShTangledFeedNS(client)
    this.git = new ShTangledGitNS(client)
    this.graph = new ShTangledGraphNS(client)
    this.repo = new ShTangledRepoNS(client)
    this.knot = new ShTangledKnotNS(client)
    this.label = new ShTangledLabelNS(client)
    this.pipeline = new ShTangledPipelineNS(client)
    this.spindle = new ShTangledSpindleNS(client)
    this.knot = new ShTangledKnotRecord(client)
    this.pipeline = new ShTangledPipelineRecord(client)
    this.repo = new ShTangledRepoRecord(client)
    this.spindle = new ShTangledSpindleRecord(client)
    this.string = new ShTangledStringRecord(client)
  }
}

export class ShTangledActorNS {
  _client: XrpcClient
  profile: ShTangledActorProfileRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.profile = new ShTangledActorProfileRecord(client)
  }
}

export class ShTangledActorProfileRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledActorProfile.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.actor.profile',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledActorProfile.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.actor.profile',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledActorProfile.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.actor.profile'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      {
        collection,
        rkey: 'self',
        ...params,
        record: { ...record, $type: collection },
      },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledActorProfile.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.actor.profile'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.actor.profile', ...params },
      { headers },
    )
  }
}

export class ShTangledFeedNS {
  _client: XrpcClient
  reaction: ShTangledFeedReactionRecord
  star: ShTangledFeedStarRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.reaction = new ShTangledFeedReactionRecord(client)
    this.star = new ShTangledFeedStarRecord(client)
  }
}

export class ShTangledFeedReactionRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledFeedReaction.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.feed.reaction',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledFeedReaction.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.feed.reaction',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledFeedReaction.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.feed.reaction'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledFeedReaction.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.feed.reaction'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.feed.reaction', ...params },
      { headers },
    )
  }
}

export class ShTangledFeedStarRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledFeedStar.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.feed.star',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledFeedStar.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.feed.star',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledFeedStar.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.feed.star'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledFeedStar.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.feed.star'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.feed.star', ...params },
      { headers },
    )
  }
}

export class ShTangledGitNS {
  _client: XrpcClient
  refUpdate: ShTangledGitRefUpdateRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.refUpdate = new ShTangledGitRefUpdateRecord(client)
  }
}

export class ShTangledGitRefUpdateRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledGitRefUpdate.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.git.refUpdate',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledGitRefUpdate.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.git.refUpdate',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledGitRefUpdate.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.git.refUpdate'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledGitRefUpdate.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.git.refUpdate'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.git.refUpdate', ...params },
      { headers },
    )
  }
}

export class ShTangledGraphNS {
  _client: XrpcClient
  follow: ShTangledGraphFollowRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.follow = new ShTangledGraphFollowRecord(client)
  }
}

export class ShTangledGraphFollowRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledGraphFollow.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.graph.follow',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledGraphFollow.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.graph.follow',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledGraphFollow.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.graph.follow'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledGraphFollow.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.graph.follow'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.graph.follow', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoNS {
  _client: XrpcClient
  issue: ShTangledRepoIssueRecord
  pull: ShTangledRepoPullRecord
  artifact: ShTangledRepoArtifactRecord
  collaborator: ShTangledRepoCollaboratorRecord
  issue: ShTangledRepoIssueNS
  pull: ShTangledRepoPullNS

  constructor(client: XrpcClient) {
    this._client = client
    this.issue = new ShTangledRepoIssueNS(client)
    this.pull = new ShTangledRepoPullNS(client)
    this.issue = new ShTangledRepoIssueRecord(client)
    this.pull = new ShTangledRepoPullRecord(client)
    this.artifact = new ShTangledRepoArtifactRecord(client)
    this.collaborator = new ShTangledRepoCollaboratorRecord(client)
  }

  addSecret(
    data?: ShTangledRepoAddSecret.InputSchema,
    opts?: ShTangledRepoAddSecret.CallOptions,
  ): Promise<ShTangledRepoAddSecret.Response> {
    return this._client.call('sh.tangled.repo.addSecret', opts?.qp, data, opts)
  }

  archive(
    params?: ShTangledRepoArchive.QueryParams,
    opts?: ShTangledRepoArchive.CallOptions,
  ): Promise<ShTangledRepoArchive.Response> {
    return this._client
      .call('sh.tangled.repo.archive', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoArchive.toKnownErr(e)
      })
  }

  blob(
    params?: ShTangledRepoBlob.QueryParams,
    opts?: ShTangledRepoBlob.CallOptions,
  ): Promise<ShTangledRepoBlob.Response> {
    return this._client
      .call('sh.tangled.repo.blob', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoBlob.toKnownErr(e)
      })
  }

  branch(
    params?: ShTangledRepoBranch.QueryParams,
    opts?: ShTangledRepoBranch.CallOptions,
  ): Promise<ShTangledRepoBranch.Response> {
    return this._client
      .call('sh.tangled.repo.branch', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoBranch.toKnownErr(e)
      })
  }

  branches(
    params?: ShTangledRepoBranches.QueryParams,
    opts?: ShTangledRepoBranches.CallOptions,
  ): Promise<ShTangledRepoBranches.Response> {
    return this._client
      .call('sh.tangled.repo.branches', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoBranches.toKnownErr(e)
      })
  }

  compare(
    params?: ShTangledRepoCompare.QueryParams,
    opts?: ShTangledRepoCompare.CallOptions,
  ): Promise<ShTangledRepoCompare.Response> {
    return this._client
      .call('sh.tangled.repo.compare', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoCompare.toKnownErr(e)
      })
  }

  create(
    data?: ShTangledRepoCreate.InputSchema,
    opts?: ShTangledRepoCreate.CallOptions,
  ): Promise<ShTangledRepoCreate.Response> {
    return this._client.call('sh.tangled.repo.create', opts?.qp, data, opts)
  }

  setDefaultBranch(
    data?: ShTangledRepoSetDefaultBranch.InputSchema,
    opts?: ShTangledRepoSetDefaultBranch.CallOptions,
  ): Promise<ShTangledRepoSetDefaultBranch.Response> {
    return this._client.call(
      'sh.tangled.repo.setDefaultBranch',
      opts?.qp,
      data,
      opts,
    )
  }

  delete(
    data?: ShTangledRepoDelete.InputSchema,
    opts?: ShTangledRepoDelete.CallOptions,
  ): Promise<ShTangledRepoDelete.Response> {
    return this._client.call('sh.tangled.repo.delete', opts?.qp, data, opts)
  }

  deleteBranch(
    data?: ShTangledRepoDeleteBranch.InputSchema,
    opts?: ShTangledRepoDeleteBranch.CallOptions,
  ): Promise<ShTangledRepoDeleteBranch.Response> {
    return this._client.call(
      'sh.tangled.repo.deleteBranch',
      opts?.qp,
      data,
      opts,
    )
  }

  diff(
    params?: ShTangledRepoDiff.QueryParams,
    opts?: ShTangledRepoDiff.CallOptions,
  ): Promise<ShTangledRepoDiff.Response> {
    return this._client
      .call('sh.tangled.repo.diff', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoDiff.toKnownErr(e)
      })
  }

  forkStatus(
    data?: ShTangledRepoForkStatus.InputSchema,
    opts?: ShTangledRepoForkStatus.CallOptions,
  ): Promise<ShTangledRepoForkStatus.Response> {
    return this._client.call('sh.tangled.repo.forkStatus', opts?.qp, data, opts)
  }

  forkSync(
    data?: ShTangledRepoForkSync.InputSchema,
    opts?: ShTangledRepoForkSync.CallOptions,
  ): Promise<ShTangledRepoForkSync.Response> {
    return this._client.call('sh.tangled.repo.forkSync', opts?.qp, data, opts)
  }

  getDefaultBranch(
    params?: ShTangledRepoGetDefaultBranch.QueryParams,
    opts?: ShTangledRepoGetDefaultBranch.CallOptions,
  ): Promise<ShTangledRepoGetDefaultBranch.Response> {
    return this._client
      .call('sh.tangled.repo.getDefaultBranch', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoGetDefaultBranch.toKnownErr(e)
      })
  }

  hiddenRef(
    data?: ShTangledRepoHiddenRef.InputSchema,
    opts?: ShTangledRepoHiddenRef.CallOptions,
  ): Promise<ShTangledRepoHiddenRef.Response> {
    return this._client.call('sh.tangled.repo.hiddenRef', opts?.qp, data, opts)
  }

  languages(
    params?: ShTangledRepoLanguages.QueryParams,
    opts?: ShTangledRepoLanguages.CallOptions,
  ): Promise<ShTangledRepoLanguages.Response> {
    return this._client
      .call('sh.tangled.repo.languages', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoLanguages.toKnownErr(e)
      })
  }

  listSecrets(
    params?: ShTangledRepoListSecrets.QueryParams,
    opts?: ShTangledRepoListSecrets.CallOptions,
  ): Promise<ShTangledRepoListSecrets.Response> {
    return this._client.call(
      'sh.tangled.repo.listSecrets',
      params,
      undefined,
      opts,
    )
  }

  log(
    params?: ShTangledRepoLog.QueryParams,
    opts?: ShTangledRepoLog.CallOptions,
  ): Promise<ShTangledRepoLog.Response> {
    return this._client
      .call('sh.tangled.repo.log', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoLog.toKnownErr(e)
      })
  }

  merge(
    data?: ShTangledRepoMerge.InputSchema,
    opts?: ShTangledRepoMerge.CallOptions,
  ): Promise<ShTangledRepoMerge.Response> {
    return this._client.call('sh.tangled.repo.merge', opts?.qp, data, opts)
  }

  mergeCheck(
    data?: ShTangledRepoMergeCheck.InputSchema,
    opts?: ShTangledRepoMergeCheck.CallOptions,
  ): Promise<ShTangledRepoMergeCheck.Response> {
    return this._client.call('sh.tangled.repo.mergeCheck', opts?.qp, data, opts)
  }

  removeSecret(
    data?: ShTangledRepoRemoveSecret.InputSchema,
    opts?: ShTangledRepoRemoveSecret.CallOptions,
  ): Promise<ShTangledRepoRemoveSecret.Response> {
    return this._client.call(
      'sh.tangled.repo.removeSecret',
      opts?.qp,
      data,
      opts,
    )
  }

  tag(
    params?: ShTangledRepoTag.QueryParams,
    opts?: ShTangledRepoTag.CallOptions,
  ): Promise<ShTangledRepoTag.Response> {
    return this._client
      .call('sh.tangled.repo.tag', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoTag.toKnownErr(e)
      })
  }

  tags(
    params?: ShTangledRepoTags.QueryParams,
    opts?: ShTangledRepoTags.CallOptions,
  ): Promise<ShTangledRepoTags.Response> {
    return this._client
      .call('sh.tangled.repo.tags', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoTags.toKnownErr(e)
      })
  }

  tree(
    params?: ShTangledRepoTree.QueryParams,
    opts?: ShTangledRepoTree.CallOptions,
  ): Promise<ShTangledRepoTree.Response> {
    return this._client
      .call('sh.tangled.repo.tree', params, undefined, opts)
      .catch((e) => {
        throw ShTangledRepoTree.toKnownErr(e)
      })
  }
}

export class ShTangledRepoIssueNS {
  _client: XrpcClient
  comment: ShTangledRepoIssueCommentRecord
  state: ShTangledRepoIssueStateRecord
  state: ShTangledRepoIssueStateNS

  constructor(client: XrpcClient) {
    this._client = client
    this.state = new ShTangledRepoIssueStateNS(client)
    this.comment = new ShTangledRepoIssueCommentRecord(client)
    this.state = new ShTangledRepoIssueStateRecord(client)
  }
}

export class ShTangledRepoIssueStateNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class ShTangledRepoIssueCommentRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoIssueComment.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.issue.comment',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoIssueComment.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.issue.comment',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssueComment.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue.comment'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssueComment.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue.comment'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.issue.comment', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoIssueStateRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoIssueState.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.issue.state',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoIssueState.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.issue.state',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssueState.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue.state'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssueState.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue.state'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.issue.state', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoPullNS {
  _client: XrpcClient
  comment: ShTangledRepoPullCommentRecord
  status: ShTangledRepoPullStatusRecord
  status: ShTangledRepoPullStatusNS

  constructor(client: XrpcClient) {
    this._client = client
    this.status = new ShTangledRepoPullStatusNS(client)
    this.comment = new ShTangledRepoPullCommentRecord(client)
    this.status = new ShTangledRepoPullStatusRecord(client)
  }
}

export class ShTangledRepoPullStatusNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class ShTangledRepoPullCommentRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoPullComment.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.pull.comment',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoPullComment.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.pull.comment',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPullComment.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull.comment'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPullComment.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull.comment'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.pull.comment', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoPullStatusRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoPullStatus.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.pull.status',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoPullStatus.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.pull.status',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPullStatus.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull.status'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPullStatus.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull.status'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.pull.status', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoIssueRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoIssue.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.issue',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledRepoIssue.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.issue',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssue.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoIssue.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.issue'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.issue', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoPullRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoPull.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.pull',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledRepoPull.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.pull',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPull.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoPull.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.pull'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.pull', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoArtifactRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoArtifact.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.artifact',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoArtifact.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.artifact',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoArtifact.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.artifact'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoArtifact.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.artifact'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.artifact', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoCollaboratorRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepoCollaborator.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo.collaborator',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledRepoCollaborator.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo.collaborator',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoCollaborator.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.collaborator'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepoCollaborator.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo.collaborator'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo.collaborator', ...params },
      { headers },
    )
  }
}

export class ShTangledKnotNS {
  _client: XrpcClient
  member: ShTangledKnotMemberRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.member = new ShTangledKnotMemberRecord(client)
  }

  listKeys(
    params?: ShTangledKnotListKeys.QueryParams,
    opts?: ShTangledKnotListKeys.CallOptions,
  ): Promise<ShTangledKnotListKeys.Response> {
    return this._client
      .call('sh.tangled.knot.listKeys', params, undefined, opts)
      .catch((e) => {
        throw ShTangledKnotListKeys.toKnownErr(e)
      })
  }

  version(
    params?: ShTangledKnotVersion.QueryParams,
    opts?: ShTangledKnotVersion.CallOptions,
  ): Promise<ShTangledKnotVersion.Response> {
    return this._client.call('sh.tangled.knot.version', params, undefined, opts)
  }
}

export class ShTangledKnotMemberRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledKnotMember.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.knot.member',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledKnotMember.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.knot.member',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledKnotMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.knot.member'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledKnotMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.knot.member'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.knot.member', ...params },
      { headers },
    )
  }
}

export class ShTangledLabelNS {
  _client: XrpcClient
  definition: ShTangledLabelDefinitionRecord
  op: ShTangledLabelOpRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.definition = new ShTangledLabelDefinitionRecord(client)
    this.op = new ShTangledLabelOpRecord(client)
  }
}

export class ShTangledLabelDefinitionRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledLabelDefinition.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.label.definition',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledLabelDefinition.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.label.definition',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledLabelDefinition.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.label.definition'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledLabelDefinition.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.label.definition'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.label.definition', ...params },
      { headers },
    )
  }
}

export class ShTangledLabelOpRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledLabelOp.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.label.op',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledLabelOp.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.label.op',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledLabelOp.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.label.op'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledLabelOp.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.label.op'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.label.op', ...params },
      { headers },
    )
  }
}

export class ShTangledPipelineNS {
  _client: XrpcClient
  status: ShTangledPipelineStatusRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.status = new ShTangledPipelineStatusRecord(client)
  }

  cancelPipeline(
    data?: ShTangledPipelineCancelPipeline.InputSchema,
    opts?: ShTangledPipelineCancelPipeline.CallOptions,
  ): Promise<ShTangledPipelineCancelPipeline.Response> {
    return this._client.call(
      'sh.tangled.pipeline.cancelPipeline',
      opts?.qp,
      data,
      opts,
    )
  }
}

export class ShTangledPipelineStatusRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledPipelineStatus.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.pipeline.status',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledPipelineStatus.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.pipeline.status',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledPipelineStatus.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.pipeline.status'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledPipelineStatus.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.pipeline.status'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.pipeline.status', ...params },
      { headers },
    )
  }
}

export class ShTangledSpindleNS {
  _client: XrpcClient
  member: ShTangledSpindleMemberRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.member = new ShTangledSpindleMemberRecord(client)
  }
}

export class ShTangledSpindleMemberRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledSpindleMember.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.spindle.member',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: ShTangledSpindleMember.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.spindle.member',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledSpindleMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.spindle.member'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledSpindleMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.spindle.member'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.spindle.member', ...params },
      { headers },
    )
  }
}

export class ShTangledKnotRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledKnot.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.knot',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledKnot.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.knot',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledKnot.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.knot'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledKnot.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.knot'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.knot', ...params },
      { headers },
    )
  }
}

export class ShTangledPipelineRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledPipeline.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.pipeline',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledPipeline.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.pipeline',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledPipeline.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.pipeline'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledPipeline.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.pipeline'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.pipeline', ...params },
      { headers },
    )
  }
}

export class ShTangledRepoRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledRepo.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.repo',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledRepo.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.repo',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepo.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledRepo.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.repo'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.repo', ...params },
      { headers },
    )
  }
}

export class ShTangledSpindleRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledSpindle.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.spindle',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledSpindle.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.spindle',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledSpindle.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.spindle'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledSpindle.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.spindle'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.spindle', ...params },
      { headers },
    )
  }
}

export class ShTangledStringRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: ShTangledString.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'sh.tangled.string',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{ uri: string; cid: string; value: ShTangledString.Record }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'sh.tangled.string',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledString.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.string'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<ShTangledString.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'sh.tangled.string'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'sh.tangled.string', ...params },
      { headers },
    )
  }
}
