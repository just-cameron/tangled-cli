/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  ShTangledActorProfile: {
    lexicon: 1,
    id: 'sh.tangled.actor.profile',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of a Tangled account profile.',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['bluesky'],
          properties: {
            avatar: {
              type: 'blob',
              description:
                "Small image to be displayed next to posts from account. AKA, 'profile picture'",
              accept: ['image/png', 'image/jpeg'],
              maxSize: 1000000,
            },
            description: {
              type: 'string',
              description: 'Free-form profile description text.',
              maxGraphemes: 256,
              maxLength: 2560,
            },
            links: {
              type: 'array',
              minLength: 0,
              maxLength: 5,
              items: {
                type: 'string',
                description:
                  'Any URI, intended for social profiles or websites, can be used to link DIDs/AT-URIs too.',
                format: 'uri',
              },
            },
            stats: {
              type: 'array',
              minLength: 0,
              maxLength: 2,
              items: {
                type: 'string',
                description: 'Vanity stats.',
                enum: [
                  'merged-pull-request-count',
                  'closed-pull-request-count',
                  'open-pull-request-count',
                  'open-issue-count',
                  'closed-issue-count',
                  'repository-count',
                  'star-count',
                ],
              },
            },
            bluesky: {
              type: 'boolean',
              description: 'Include link to this account on Bluesky.',
            },
            location: {
              type: 'string',
              description: 'Free-form location text.',
              maxGraphemes: 40,
              maxLength: 400,
            },
            pinnedRepositories: {
              type: 'array',
              description:
                'Any ATURI, it is up to appviews to validate these fields.',
              minLength: 0,
              maxLength: 6,
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
            pronouns: {
              type: 'string',
              description: 'Preferred gender pronouns.',
              maxLength: 40,
            },
          },
        },
      },
    },
  },
  ShTangledFeedReaction: {
    lexicon: 1,
    id: 'sh.tangled.feed.reaction',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'reaction', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'at-uri',
            },
            reaction: {
              type: 'string',
              enum: ['👍', '👎', '😆', '🎉', '🫤', '❤️', '🚀', '👀'],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledFeedStar: {
    lexicon: 1,
    id: 'sh.tangled.feed.star',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'at-uri',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledGitRefUpdate: {
    lexicon: 1,
    id: 'sh.tangled.git.refUpdate',
    defs: {
      main: {
        type: 'record',
        description: 'An update to a git repository, emitted by knots.',
        key: 'tid',
        record: {
          type: 'object',
          required: [
            'ref',
            'committerDid',
            'repoDid',
            'repoName',
            'oldSha',
            'newSha',
            'meta',
          ],
          properties: {
            ref: {
              type: 'string',
              description: 'Ref being updated',
              maxGraphemes: 256,
              maxLength: 2560,
            },
            committerDid: {
              type: 'string',
              description: 'did of the user that pushed this ref',
              format: 'did',
            },
            repoDid: {
              type: 'string',
              description: 'did of the owner of the repo',
              format: 'did',
            },
            repoName: {
              type: 'string',
              description: 'name of the repo',
            },
            oldSha: {
              type: 'string',
              description: 'old SHA of this ref',
              minLength: 40,
              maxLength: 40,
            },
            newSha: {
              type: 'string',
              description: 'new SHA of this ref',
              minLength: 40,
              maxLength: 40,
            },
            meta: {
              type: 'ref',
              ref: 'lex:sh.tangled.git.refUpdate#meta',
            },
          },
        },
      },
      meta: {
        type: 'object',
        required: ['isDefaultRef', 'commitCount'],
        properties: {
          isDefaultRef: {
            type: 'boolean',
            default: false,
          },
          langBreakdown: {
            type: 'ref',
            ref: 'lex:sh.tangled.git.refUpdate#langBreakdown',
          },
          commitCount: {
            type: 'ref',
            ref: 'lex:sh.tangled.git.refUpdate#commitCountBreakdown',
          },
        },
      },
      langBreakdown: {
        type: 'object',
        properties: {
          inputs: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:sh.tangled.git.refUpdate#individualLanguageSize',
            },
          },
        },
      },
      individualLanguageSize: {
        type: 'object',
        required: ['lang', 'size'],
        properties: {
          lang: {
            type: 'string',
          },
          size: {
            type: 'integer',
          },
        },
      },
      commitCountBreakdown: {
        type: 'object',
        required: [],
        properties: {
          byEmail: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:sh.tangled.git.refUpdate#individualEmailCommitCount',
            },
          },
        },
      },
      individualEmailCommitCount: {
        type: 'object',
        required: ['email', 'count'],
        properties: {
          email: {
            type: 'string',
          },
          count: {
            type: 'integer',
          },
        },
      },
    },
  },
  ShTangledGraphFollow: {
    lexicon: 1,
    id: 'sh.tangled.graph.follow',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'did',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledRepoIssueStateClosed: {
    lexicon: 1,
    id: 'sh.tangled.repo.issue.state.closed',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'token',
        description: 'closed issue',
      },
    },
  },
  ShTangledRepoIssueComment: {
    lexicon: 1,
    id: 'sh.tangled.repo.issue.comment',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['issue', 'body', 'createdAt'],
          properties: {
            issue: {
              type: 'string',
              format: 'at-uri',
            },
            body: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            replyTo: {
              type: 'string',
              format: 'at-uri',
            },
            mentions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'did',
              },
            },
            references: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoIssue: {
    lexicon: 1,
    id: 'sh.tangled.repo.issue',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['repo', 'title', 'createdAt'],
          properties: {
            repo: {
              type: 'string',
              format: 'at-uri',
            },
            title: {
              type: 'string',
            },
            body: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            mentions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'did',
              },
            },
            references: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoIssueStateOpen: {
    lexicon: 1,
    id: 'sh.tangled.repo.issue.state.open',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'token',
        description: 'open issue',
      },
    },
  },
  ShTangledRepoIssueState: {
    lexicon: 1,
    id: 'sh.tangled.repo.issue.state',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['issue', 'state'],
          properties: {
            issue: {
              type: 'string',
              format: 'at-uri',
            },
            state: {
              type: 'string',
              description: 'state of the issue',
              knownValues: [
                'sh.tangled.repo.issue.state.open',
                'sh.tangled.repo.issue.state.closed',
              ],
              default: 'sh.tangled.repo.issue.state.open',
            },
          },
        },
      },
    },
  },
  ShTangledKnot: {
    lexicon: 1,
    id: 'sh.tangled.knot',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'any',
        record: {
          type: 'object',
          required: ['createdAt'],
          properties: {
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledKnotListKeys: {
    lexicon: 1,
    id: 'sh.tangled.knot.listKeys',
    defs: {
      main: {
        type: 'query',
        description: 'List all public keys stored in the knot server',
        parameters: {
          type: 'params',
          properties: {
            limit: {
              type: 'integer',
              description: 'Maximum number of keys to return',
              minimum: 1,
              maximum: 1000,
              default: 100,
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['keys'],
            properties: {
              keys: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:sh.tangled.knot.listKeys#publicKey',
                },
              },
              cursor: {
                type: 'string',
                description: 'Pagination cursor for next page',
              },
            },
          },
        },
        errors: [
          {
            name: 'InternalServerError',
            description: 'Failed to retrieve public keys',
          },
        ],
      },
      publicKey: {
        type: 'object',
        required: ['did', 'key', 'createdAt'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
            description: 'DID associated with the public key',
          },
          key: {
            type: 'string',
            maxLength: 4096,
            description: 'Public key contents',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
            description: 'Key upload timestamp',
          },
        },
      },
    },
  },
  ShTangledKnotMember: {
    lexicon: 1,
    id: 'sh.tangled.knot.member',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'domain', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'did',
            },
            domain: {
              type: 'string',
              description: 'domain that this member now belongs to',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledKnotVersion: {
    lexicon: 1,
    id: 'sh.tangled.knot.version',
    defs: {
      main: {
        type: 'query',
        description: 'Get the version of a knot',
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['version'],
            properties: {
              version: {
                type: 'string',
              },
            },
          },
        },
        errors: [],
      },
    },
  },
  ShTangledLabelDefinition: {
    lexicon: 1,
    id: 'sh.tangled.label.definition',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'any',
        record: {
          type: 'object',
          required: ['name', 'valueType', 'scope', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              description: 'The display name of this label.',
              minGraphemes: 1,
              maxGraphemes: 40,
            },
            valueType: {
              type: 'ref',
              ref: 'lex:sh.tangled.label.definition#valueType',
              description:
                'The type definition of this label. Appviews may allow sorting for certain types.',
            },
            scope: {
              type: 'array',
              description:
                'The areas of the repo this label may apply to, eg.: sh.tangled.repo.issue. Appviews may choose to respect this.',
              items: {
                type: 'string',
                format: 'nsid',
              },
            },
            color: {
              type: 'string',
              description:
                'The hex value for the background color for the label. Appviews may choose to respect this.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            multiple: {
              type: 'boolean',
              description:
                'Whether this label can be repeated for a given entity, eg.: [reviewer:foo, reviewer:bar]',
            },
          },
        },
      },
      valueType: {
        type: 'object',
        required: ['type', 'format'],
        properties: {
          type: {
            type: 'string',
            enum: ['null', 'boolean', 'integer', 'string'],
            description: "The concrete type of this label's value.",
          },
          format: {
            type: 'string',
            enum: ['any', 'did', 'nsid'],
            description:
              'An optional constraint that can be applied on string concrete types.',
          },
          enum: {
            type: 'array',
            description: 'Closed set of values that this label can take.',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  ShTangledLabelOp: {
    lexicon: 1,
    id: 'sh.tangled.label.op',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'add', 'delete', 'performedAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'at-uri',
              description:
                'The subject (task, pull or discussion) of this label. Appviews may apply a `scope` check and refuse this op.',
            },
            performedAt: {
              type: 'string',
              format: 'datetime',
            },
            add: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:sh.tangled.label.op#operand',
              },
            },
            delete: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:sh.tangled.label.op#operand',
              },
            },
          },
        },
      },
      operand: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: {
            type: 'string',
            format: 'at-uri',
            description: 'ATURI to the label definition',
          },
          value: {
            type: 'string',
            description:
              'Stringified value of the label. This is first unstringed by appviews and then interpreted as a concrete value.',
          },
        },
      },
    },
  },
  ShTangledPipelineCancelPipeline: {
    lexicon: 1,
    id: 'sh.tangled.pipeline.cancelPipeline',
    defs: {
      main: {
        type: 'procedure',
        description: 'Cancel a running pipeline',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'pipeline', 'workflow'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
                description:
                  "repo at-uri, spindle can't resolve repo from pipeline at-uri yet",
              },
              pipeline: {
                type: 'string',
                format: 'at-uri',
                description: 'pipeline at-uri',
              },
              workflow: {
                type: 'string',
                description: 'workflow name',
              },
            },
          },
        },
      },
    },
  },
  ShTangledPipeline: {
    lexicon: 1,
    id: 'sh.tangled.pipeline',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['triggerMetadata', 'workflows'],
          properties: {
            triggerMetadata: {
              type: 'ref',
              ref: 'lex:sh.tangled.pipeline#triggerMetadata',
            },
            workflows: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:sh.tangled.pipeline#workflow',
              },
            },
          },
        },
      },
      triggerMetadata: {
        type: 'object',
        required: ['kind', 'repo'],
        properties: {
          kind: {
            type: 'string',
            enum: ['push', 'pull_request', 'manual'],
          },
          repo: {
            type: 'ref',
            ref: 'lex:sh.tangled.pipeline#triggerRepo',
          },
          push: {
            type: 'ref',
            ref: 'lex:sh.tangled.pipeline#pushTriggerData',
          },
          pullRequest: {
            type: 'ref',
            ref: 'lex:sh.tangled.pipeline#pullRequestTriggerData',
          },
          manual: {
            type: 'ref',
            ref: 'lex:sh.tangled.pipeline#manualTriggerData',
          },
        },
      },
      triggerRepo: {
        type: 'object',
        required: ['knot', 'did', 'repo', 'defaultBranch'],
        properties: {
          knot: {
            type: 'string',
          },
          did: {
            type: 'string',
            format: 'did',
          },
          repo: {
            type: 'string',
          },
          defaultBranch: {
            type: 'string',
          },
        },
      },
      pushTriggerData: {
        type: 'object',
        required: ['ref', 'newSha', 'oldSha'],
        properties: {
          ref: {
            type: 'string',
          },
          newSha: {
            type: 'string',
            minLength: 40,
            maxLength: 40,
          },
          oldSha: {
            type: 'string',
            minLength: 40,
            maxLength: 40,
          },
        },
      },
      pullRequestTriggerData: {
        type: 'object',
        required: ['sourceBranch', 'targetBranch', 'sourceSha', 'action'],
        properties: {
          sourceBranch: {
            type: 'string',
          },
          targetBranch: {
            type: 'string',
          },
          sourceSha: {
            type: 'string',
            minLength: 40,
            maxLength: 40,
          },
          action: {
            type: 'string',
          },
        },
      },
      manualTriggerData: {
        type: 'object',
        properties: {
          inputs: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:sh.tangled.pipeline#pair',
            },
          },
        },
      },
      workflow: {
        type: 'object',
        required: ['name', 'engine', 'clone', 'raw'],
        properties: {
          name: {
            type: 'string',
          },
          engine: {
            type: 'string',
          },
          clone: {
            type: 'ref',
            ref: 'lex:sh.tangled.pipeline#cloneOpts',
          },
          raw: {
            type: 'string',
          },
        },
      },
      cloneOpts: {
        type: 'object',
        required: ['skip', 'depth', 'submodules'],
        properties: {
          skip: {
            type: 'boolean',
          },
          depth: {
            type: 'integer',
          },
          submodules: {
            type: 'boolean',
          },
        },
      },
      pair: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
      },
    },
  },
  ShTangledPipelineStatus: {
    lexicon: 1,
    id: 'sh.tangled.pipeline.status',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['pipeline', 'workflow', 'status', 'createdAt'],
          properties: {
            pipeline: {
              type: 'string',
              format: 'at-uri',
              description: 'ATURI of the pipeline',
            },
            workflow: {
              type: 'string',
              format: 'at-uri',
              description: 'name of the workflow within this pipeline',
            },
            status: {
              type: 'string',
              description: 'status of the workflow',
              enum: [
                'pending',
                'running',
                'failed',
                'timeout',
                'cancelled',
                'success',
              ],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'time of creation of this status update',
            },
            error: {
              type: 'string',
              description: 'error message if failed',
            },
            exitCode: {
              type: 'integer',
              description: 'exit code if failed',
            },
          },
        },
      },
    },
  },
  ShTangledRepoPullStatusClosed: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull.status.closed',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'token',
        description: 'closed pull request',
      },
    },
  },
  ShTangledRepoPullComment: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull.comment',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['pull', 'body', 'createdAt'],
          properties: {
            pull: {
              type: 'string',
              format: 'at-uri',
            },
            body: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            mentions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'did',
              },
            },
            references: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoPullStatusMerged: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull.status.merged',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'token',
        description: 'merged pull request',
      },
    },
  },
  ShTangledRepoPullStatusOpen: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull.status.open',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'token',
        description: 'open pull request',
      },
    },
  },
  ShTangledRepoPull: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['target', 'title', 'patchBlob', 'createdAt'],
          properties: {
            target: {
              type: 'ref',
              ref: 'lex:sh.tangled.repo.pull#target',
            },
            title: {
              type: 'string',
            },
            body: {
              type: 'string',
            },
            patch: {
              type: 'string',
              description: '(deprecated) use patchBlob instead',
            },
            patchBlob: {
              type: 'blob',
              accept: ['text/x-patch'],
              description: 'patch content',
            },
            source: {
              type: 'ref',
              ref: 'lex:sh.tangled.repo.pull#source',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            mentions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'did',
              },
            },
            references: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
          },
        },
      },
      target: {
        type: 'object',
        required: ['repo', 'branch'],
        properties: {
          repo: {
            type: 'string',
            format: 'at-uri',
          },
          branch: {
            type: 'string',
          },
        },
      },
      source: {
        type: 'object',
        required: ['branch', 'sha'],
        properties: {
          branch: {
            type: 'string',
          },
          sha: {
            type: 'string',
            minLength: 40,
            maxLength: 40,
          },
          repo: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
    },
  },
  ShTangledRepoPullStatus: {
    lexicon: 1,
    id: 'sh.tangled.repo.pull.status',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['pull', 'status'],
          properties: {
            pull: {
              type: 'string',
              format: 'at-uri',
            },
            status: {
              type: 'string',
              description: 'status of the pull request',
              knownValues: [
                'sh.tangled.repo.pull.status.open',
                'sh.tangled.repo.pull.status.closed',
                'sh.tangled.repo.pull.status.merged',
              ],
              default: 'sh.tangled.repo.pull.status.open',
            },
          },
        },
      },
    },
  },
  ShTangledRepoAddSecret: {
    lexicon: 1,
    id: 'sh.tangled.repo.addSecret',
    defs: {
      main: {
        type: 'procedure',
        description: 'Add a CI secret',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'key', 'value'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
              },
              key: {
                type: 'string',
                maxLength: 50,
                minLength: 1,
              },
              value: {
                type: 'string',
                maxLength: 200,
                minLength: 1,
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoArchive: {
    lexicon: 1,
    id: 'sh.tangled.repo.archive',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'ref'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
            },
            format: {
              type: 'string',
              description: 'Archive format',
              enum: ['tar', 'zip', 'tar.gz', 'tar.bz2', 'tar.xz'],
              default: 'tar.gz',
            },
            prefix: {
              type: 'string',
              description: 'Prefix for files in the archive',
            },
          },
        },
        output: {
          encoding: '*/*',
          description: 'Binary archive data',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
          {
            name: 'ArchiveError',
            description: 'Failed to create archive',
          },
        ],
      },
    },
  },
  ShTangledRepoArtifact: {
    lexicon: 1,
    id: 'sh.tangled.repo.artifact',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'repo', 'tag', 'createdAt', 'artifact'],
          properties: {
            name: {
              type: 'string',
              description: 'name of the artifact',
            },
            repo: {
              type: 'string',
              format: 'at-uri',
              description: 'repo that this artifact is being uploaded to',
            },
            tag: {
              type: 'bytes',
              description:
                'hash of the tag object that this artifact is attached to (only annotated tags are supported)',
              minLength: 20,
              maxLength: 20,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'time of creation of this artifact',
            },
            artifact: {
              type: 'blob',
              description: 'the artifact',
              accept: ['*/*'],
              maxSize: 52428800,
            },
          },
        },
      },
    },
  },
  ShTangledRepoBlob: {
    lexicon: 1,
    id: 'sh.tangled.repo.blob',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'ref', 'path'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
            },
            path: {
              type: 'string',
              description: 'Path to the file within the repository',
            },
            raw: {
              type: 'boolean',
              description: 'Return raw file content instead of JSON response',
              default: false,
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['ref', 'path'],
            properties: {
              ref: {
                type: 'string',
                description: 'The git reference used',
              },
              path: {
                type: 'string',
                description: 'The file path',
              },
              content: {
                type: 'string',
                description: 'File content (base64 encoded for binary files)',
              },
              encoding: {
                type: 'string',
                description: 'Content encoding',
                enum: ['utf-8', 'base64'],
              },
              size: {
                type: 'integer',
                description: 'File size in bytes',
              },
              isBinary: {
                type: 'boolean',
                description: 'Whether the file is binary',
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the file',
              },
              submodule: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.blob#submodule',
                description: 'Submodule information if path is a submodule',
              },
              lastCommit: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.blob#lastCommit',
              },
            },
          },
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'FileNotFound',
            description: 'File not found at the specified path',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
      lastCommit: {
        type: 'object',
        required: ['hash', 'message', 'when'],
        properties: {
          hash: {
            type: 'string',
            description: 'Commit hash',
          },
          message: {
            type: 'string',
            description: 'Commit message',
          },
          author: {
            type: 'ref',
            ref: 'lex:sh.tangled.repo.blob#signature',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Commit timestamp',
          },
        },
      },
      signature: {
        type: 'object',
        required: ['name', 'email', 'when'],
        properties: {
          name: {
            type: 'string',
            description: 'Author name',
          },
          email: {
            type: 'string',
            description: 'Author email',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Author timestamp',
          },
        },
      },
      submodule: {
        type: 'object',
        required: ['name', 'url'],
        properties: {
          name: {
            type: 'string',
            description: 'Submodule name',
          },
          url: {
            type: 'string',
            description: 'Submodule repository URL',
          },
          branch: {
            type: 'string',
            description: 'Branch to track in the submodule',
          },
        },
      },
    },
  },
  ShTangledRepoBranch: {
    lexicon: 1,
    id: 'sh.tangled.repo.branch',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'name'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            name: {
              type: 'string',
              description: 'Branch name to get information for',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['name', 'hash', 'when'],
            properties: {
              name: {
                type: 'string',
                description: 'Branch name',
              },
              hash: {
                type: 'string',
                description: 'Latest commit hash on this branch',
              },
              shortHash: {
                type: 'string',
                description: 'Short commit hash',
              },
              when: {
                type: 'string',
                format: 'datetime',
                description: 'Timestamp of latest commit',
              },
              message: {
                type: 'string',
                description: 'Latest commit message',
              },
              author: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.branch#signature',
              },
              isDefault: {
                type: 'boolean',
                description: 'Whether this is the default branch',
              },
            },
          },
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'BranchNotFound',
            description: 'Branch not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
      signature: {
        type: 'object',
        required: ['name', 'email', 'when'],
        properties: {
          name: {
            type: 'string',
            description: 'Author name',
          },
          email: {
            type: 'string',
            description: 'Author email',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Author timestamp',
          },
        },
      },
    },
  },
  ShTangledRepoBranches: {
    lexicon: 1,
    id: 'sh.tangled.repo.branches',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of branches to return',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor',
            },
          },
        },
        output: {
          encoding: '*/*',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
    },
  },
  ShTangledRepoCollaborator: {
    lexicon: 1,
    id: 'sh.tangled.repo.collaborator',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'repo', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'did',
            },
            repo: {
              type: 'string',
              description: 'repo to add this user to',
              format: 'at-uri',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledRepoCompare: {
    lexicon: 1,
    id: 'sh.tangled.repo.compare',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'rev1', 'rev2'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            rev1: {
              type: 'string',
              description: 'First revision (commit, branch, or tag)',
            },
            rev2: {
              type: 'string',
              description: 'Second revision (commit, branch, or tag)',
            },
          },
        },
        output: {
          encoding: '*/*',
          description: 'Compare output in application/json',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RevisionNotFound',
            description: 'One or both revisions not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
          {
            name: 'CompareError',
            description: 'Failed to compare revisions',
          },
        ],
      },
    },
  },
  ShTangledRepoCreate: {
    lexicon: 1,
    id: 'sh.tangled.repo.create',
    defs: {
      main: {
        type: 'procedure',
        description: 'Create a new repository',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['rkey'],
            properties: {
              rkey: {
                type: 'string',
                description: 'Rkey of the repository record',
              },
              defaultBranch: {
                type: 'string',
                description: 'Default branch to push to',
              },
              source: {
                type: 'string',
                description:
                  'A source URL to clone from, populate this when forking or importing a repository.',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoSetDefaultBranch: {
    lexicon: 1,
    id: 'sh.tangled.repo.setDefaultBranch',
    defs: {
      main: {
        type: 'procedure',
        description: 'Set the default branch for a repository',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'defaultBranch'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
              },
              defaultBranch: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoDelete: {
    lexicon: 1,
    id: 'sh.tangled.repo.delete',
    defs: {
      main: {
        type: 'procedure',
        description: 'Delete a repository',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['did', 'name', 'rkey'],
            properties: {
              did: {
                type: 'string',
                format: 'did',
                description: 'DID of the repository owner',
              },
              name: {
                type: 'string',
                description: 'Name of the repository to delete',
              },
              rkey: {
                type: 'string',
                description: 'Rkey of the repository record',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoDeleteBranch: {
    lexicon: 1,
    id: 'sh.tangled.repo.deleteBranch',
    defs: {
      main: {
        type: 'procedure',
        description: 'Delete a branch on this repository',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'branch'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
              },
              branch: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoDiff: {
    lexicon: 1,
    id: 'sh.tangled.repo.diff',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'ref'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
            },
          },
        },
        output: {
          encoding: '*/*',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
    },
  },
  ShTangledRepoForkStatus: {
    lexicon: 1,
    id: 'sh.tangled.repo.forkStatus',
    defs: {
      main: {
        type: 'procedure',
        description: 'Check fork status relative to upstream source',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['did', 'name', 'source', 'branch', 'hiddenRef'],
            properties: {
              did: {
                type: 'string',
                format: 'did',
                description: 'DID of the fork owner',
              },
              name: {
                type: 'string',
                description: 'Name of the forked repository',
              },
              source: {
                type: 'string',
                description: 'Source repository URL',
              },
              branch: {
                type: 'string',
                description: 'Branch to check status for',
              },
              hiddenRef: {
                type: 'string',
                description: 'Hidden ref to use for comparison',
              },
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {
                type: 'integer',
                description:
                  'Fork status: 0=UpToDate, 1=FastForwardable, 2=Conflict, 3=MissingBranch',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoForkSync: {
    lexicon: 1,
    id: 'sh.tangled.repo.forkSync',
    defs: {
      main: {
        type: 'procedure',
        description: 'Sync a forked repository with its upstream source',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['did', 'source', 'name', 'branch'],
            properties: {
              did: {
                type: 'string',
                format: 'did',
                description: 'DID of the fork owner',
              },
              source: {
                type: 'string',
                format: 'at-uri',
                description: 'AT-URI of the source repository',
              },
              name: {
                type: 'string',
                description: 'Name of the forked repository',
              },
              branch: {
                type: 'string',
                description: 'Branch to sync',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoGetDefaultBranch: {
    lexicon: 1,
    id: 'sh.tangled.repo.getDefaultBranch',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['name', 'hash', 'when'],
            properties: {
              name: {
                type: 'string',
                description: 'Default branch name',
              },
              hash: {
                type: 'string',
                description: 'Latest commit hash on default branch',
              },
              shortHash: {
                type: 'string',
                description: 'Short commit hash',
              },
              when: {
                type: 'string',
                format: 'datetime',
                description: 'Timestamp of latest commit',
              },
              message: {
                type: 'string',
                description: 'Latest commit message',
              },
              author: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.getDefaultBranch#signature',
              },
            },
          },
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
      signature: {
        type: 'object',
        required: ['name', 'email', 'when'],
        properties: {
          name: {
            type: 'string',
            description: 'Author name',
          },
          email: {
            type: 'string',
            description: 'Author email',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Author timestamp',
          },
        },
      },
    },
  },
  ShTangledRepoHiddenRef: {
    lexicon: 1,
    id: 'sh.tangled.repo.hiddenRef',
    defs: {
      main: {
        type: 'procedure',
        description: 'Create a hidden ref in a repository',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'forkRef', 'remoteRef'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
                description: 'AT-URI of the repository',
              },
              forkRef: {
                type: 'string',
                description: 'Fork reference name',
              },
              remoteRef: {
                type: 'string',
                description: 'Remote reference name',
              },
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['success'],
            properties: {
              success: {
                type: 'boolean',
                description: 'Whether the hidden ref was created successfully',
              },
              ref: {
                type: 'string',
                description: 'The created hidden ref name',
              },
              error: {
                type: 'string',
                description: 'Error message if creation failed',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoLanguages: {
    lexicon: 1,
    id: 'sh.tangled.repo.languages',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
              default: 'HEAD',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['ref', 'languages'],
            properties: {
              ref: {
                type: 'string',
                description: 'The git reference used',
              },
              languages: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:sh.tangled.repo.languages#language',
                },
              },
              totalSize: {
                type: 'integer',
                description: 'Total size of all analyzed files in bytes',
              },
              totalFiles: {
                type: 'integer',
                description: 'Total number of files analyzed',
              },
            },
          },
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
      language: {
        type: 'object',
        required: ['name', 'size', 'percentage'],
        properties: {
          name: {
            type: 'string',
            description: 'Programming language name',
          },
          size: {
            type: 'integer',
            description: 'Total size of files in this language (bytes)',
          },
          percentage: {
            type: 'integer',
            description: 'Percentage of total codebase (0-100)',
          },
          fileCount: {
            type: 'integer',
            description: 'Number of files in this language',
          },
          color: {
            type: 'string',
            description: 'Hex color code for this language',
          },
          extensions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'File extensions associated with this language',
          },
        },
      },
    },
  },
  ShTangledRepoListSecrets: {
    lexicon: 1,
    id: 'sh.tangled.repo.listSecrets',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo'],
          properties: {
            repo: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['secrets'],
            properties: {
              secrets: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:sh.tangled.repo.listSecrets#secret',
                },
              },
            },
          },
        },
      },
      secret: {
        type: 'object',
        required: ['repo', 'key', 'createdAt', 'createdBy'],
        properties: {
          repo: {
            type: 'string',
            format: 'at-uri',
          },
          key: {
            type: 'string',
            maxLength: 50,
            minLength: 1,
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          createdBy: {
            type: 'string',
            format: 'did',
          },
        },
      },
    },
  },
  ShTangledRepoLog: {
    lexicon: 1,
    id: 'sh.tangled.repo.log',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'ref'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
            },
            path: {
              type: 'string',
              description: 'Path to filter commits by',
              default: '',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of commits to return',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor (commit SHA)',
            },
          },
        },
        output: {
          encoding: '*/*',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'PathNotFound',
            description: 'Path not found in repository',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
    },
  },
  ShTangledRepoMerge: {
    lexicon: 1,
    id: 'sh.tangled.repo.merge',
    defs: {
      main: {
        type: 'procedure',
        description: 'Merge a patch into a repository branch',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['did', 'name', 'patch', 'branch'],
            properties: {
              did: {
                type: 'string',
                format: 'did',
                description: 'DID of the repository owner',
              },
              name: {
                type: 'string',
                description: 'Name of the repository',
              },
              patch: {
                type: 'string',
                description: 'Patch content to merge',
              },
              branch: {
                type: 'string',
                description: 'Target branch to merge into',
              },
              authorName: {
                type: 'string',
                description: 'Author name for the merge commit',
              },
              authorEmail: {
                type: 'string',
                description: 'Author email for the merge commit',
              },
              commitBody: {
                type: 'string',
                description: 'Additional commit message body',
              },
              commitMessage: {
                type: 'string',
                description: 'Merge commit message',
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepoMergeCheck: {
    lexicon: 1,
    id: 'sh.tangled.repo.mergeCheck',
    defs: {
      main: {
        type: 'procedure',
        description: 'Check if a merge is possible between two branches',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['did', 'name', 'patch', 'branch'],
            properties: {
              did: {
                type: 'string',
                format: 'did',
                description: 'DID of the repository owner',
              },
              name: {
                type: 'string',
                description: 'Name of the repository',
              },
              patch: {
                type: 'string',
                description:
                  'Patch or pull request to check for merge conflicts',
              },
              branch: {
                type: 'string',
                description: 'Target branch to merge into',
              },
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['is_conflicted'],
            properties: {
              is_conflicted: {
                type: 'boolean',
                description: 'Whether the merge has conflicts',
              },
              conflicts: {
                type: 'array',
                description: 'List of files with merge conflicts',
                items: {
                  type: 'ref',
                  ref: 'lex:sh.tangled.repo.mergeCheck#conflictInfo',
                },
              },
              message: {
                type: 'string',
                description: 'Additional message about the merge check',
              },
              error: {
                type: 'string',
                description: 'Error message if check failed',
              },
            },
          },
        },
      },
      conflictInfo: {
        type: 'object',
        required: ['filename', 'reason'],
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the conflicted file',
          },
          reason: {
            type: 'string',
            description: 'Reason for the conflict',
          },
        },
      },
    },
  },
  ShTangledRepoRemoveSecret: {
    lexicon: 1,
    id: 'sh.tangled.repo.removeSecret',
    defs: {
      main: {
        type: 'procedure',
        description: 'Remove a CI secret',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['repo', 'key'],
            properties: {
              repo: {
                type: 'string',
                format: 'at-uri',
              },
              key: {
                type: 'string',
                maxLength: 50,
                minLength: 1,
              },
            },
          },
        },
      },
    },
  },
  ShTangledRepo: {
    lexicon: 1,
    id: 'sh.tangled.repo',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'knot', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              description: 'name of the repo',
            },
            knot: {
              type: 'string',
              description: 'knot where the repo was created',
            },
            spindle: {
              type: 'string',
              description: 'CI runner to send jobs to and receive results from',
            },
            description: {
              type: 'string',
              minGraphemes: 1,
              maxGraphemes: 140,
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Any URI related to the repo',
            },
            topics: {
              type: 'array',
              description: 'Topics related to the repo',
              items: {
                type: 'string',
                minLength: 1,
                maxLength: 50,
              },
              maxLength: 50,
            },
            source: {
              type: 'string',
              format: 'uri',
              description: 'source of the repo',
            },
            labels: {
              type: 'array',
              description: 'List of labels that this repo subscribes to',
              items: {
                type: 'string',
                format: 'at-uri',
              },
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledRepoTag: {
    lexicon: 1,
    id: 'sh.tangled.repo.tag',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'tag'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            tag: {
              type: 'string',
              description: 'Name of tag, such as v1.3.0',
            },
          },
        },
        output: {
          encoding: '*/*',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'TagNotFound',
            description: 'Tag not found',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
    },
  },
  ShTangledRepoTags: {
    lexicon: 1,
    id: 'sh.tangled.repo.tags',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of tags to return',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor',
            },
          },
        },
        output: {
          encoding: '*/*',
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
    },
  },
  ShTangledRepoTree: {
    lexicon: 1,
    id: 'sh.tangled.repo.tree',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['repo', 'ref'],
          properties: {
            repo: {
              type: 'string',
              description:
                "Repository identifier in format 'did:plc:.../repoName'",
            },
            ref: {
              type: 'string',
              description: 'Git reference (branch, tag, or commit SHA)',
            },
            path: {
              type: 'string',
              description: 'Path within the repository tree',
              default: '',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['ref', 'files'],
            properties: {
              ref: {
                type: 'string',
                description: 'The git reference used',
              },
              parent: {
                type: 'string',
                description: 'The parent path in the tree',
              },
              dotdot: {
                type: 'string',
                description: 'Parent directory path',
              },
              readme: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.tree#readme',
                description: 'Readme for this file tree',
              },
              lastCommit: {
                type: 'ref',
                ref: 'lex:sh.tangled.repo.tree#lastCommit',
              },
              files: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:sh.tangled.repo.tree#treeEntry',
                },
              },
            },
          },
        },
        errors: [
          {
            name: 'RepoNotFound',
            description: 'Repository not found or access denied',
          },
          {
            name: 'RefNotFound',
            description: 'Git reference not found',
          },
          {
            name: 'PathNotFound',
            description: 'Path not found in repository tree',
          },
          {
            name: 'InvalidRequest',
            description: 'Invalid request parameters',
          },
        ],
      },
      readme: {
        type: 'object',
        required: ['filename', 'contents'],
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the readme file',
          },
          contents: {
            type: 'string',
            description: 'Contents of the readme file',
          },
        },
      },
      treeEntry: {
        type: 'object',
        required: ['name', 'mode', 'size'],
        properties: {
          name: {
            type: 'string',
            description: 'Relative file or directory name',
          },
          mode: {
            type: 'string',
            description: 'File mode',
          },
          size: {
            type: 'integer',
            description: 'File size in bytes',
          },
          last_commit: {
            type: 'ref',
            ref: 'lex:sh.tangled.repo.tree#lastCommit',
          },
        },
      },
      lastCommit: {
        type: 'object',
        required: ['hash', 'message', 'when'],
        properties: {
          hash: {
            type: 'string',
            description: 'Commit hash',
          },
          message: {
            type: 'string',
            description: 'Commit message',
          },
          author: {
            type: 'ref',
            ref: 'lex:sh.tangled.repo.tree#signature',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Commit timestamp',
          },
        },
      },
      signature: {
        type: 'object',
        required: ['name', 'email', 'when'],
        properties: {
          name: {
            type: 'string',
            description: 'Author name',
          },
          email: {
            type: 'string',
            description: 'Author email',
          },
          when: {
            type: 'string',
            format: 'datetime',
            description: 'Author timestamp',
          },
        },
      },
    },
  },
  ShTangledSpindleMember: {
    lexicon: 1,
    id: 'sh.tangled.spindle.member',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subject', 'instance', 'createdAt'],
          properties: {
            subject: {
              type: 'string',
              format: 'did',
            },
            instance: {
              type: 'string',
              description:
                'spindle instance that the subject is now a member of',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledSpindle: {
    lexicon: 1,
    id: 'sh.tangled.spindle',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'any',
        record: {
          type: 'object',
          required: ['createdAt'],
          properties: {
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ShTangledString: {
    lexicon: 1,
    id: 'sh.tangled.string',
    needsCbor: true,
    needsType: true,
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['filename', 'description', 'createdAt', 'contents'],
          properties: {
            filename: {
              type: 'string',
              maxGraphemes: 140,
              minGraphemes: 1,
            },
            description: {
              type: 'string',
              maxGraphemes: 280,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            contents: {
              type: 'string',
              minGraphemes: 1,
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  ShTangledActorProfile: 'sh.tangled.actor.profile',
  ShTangledFeedReaction: 'sh.tangled.feed.reaction',
  ShTangledFeedStar: 'sh.tangled.feed.star',
  ShTangledGitRefUpdate: 'sh.tangled.git.refUpdate',
  ShTangledGraphFollow: 'sh.tangled.graph.follow',
  ShTangledRepoIssueStateClosed: 'sh.tangled.repo.issue.state.closed',
  ShTangledRepoIssueComment: 'sh.tangled.repo.issue.comment',
  ShTangledRepoIssue: 'sh.tangled.repo.issue',
  ShTangledRepoIssueStateOpen: 'sh.tangled.repo.issue.state.open',
  ShTangledRepoIssueState: 'sh.tangled.repo.issue.state',
  ShTangledKnot: 'sh.tangled.knot',
  ShTangledKnotListKeys: 'sh.tangled.knot.listKeys',
  ShTangledKnotMember: 'sh.tangled.knot.member',
  ShTangledKnotVersion: 'sh.tangled.knot.version',
  ShTangledLabelDefinition: 'sh.tangled.label.definition',
  ShTangledLabelOp: 'sh.tangled.label.op',
  ShTangledPipelineCancelPipeline: 'sh.tangled.pipeline.cancelPipeline',
  ShTangledPipeline: 'sh.tangled.pipeline',
  ShTangledPipelineStatus: 'sh.tangled.pipeline.status',
  ShTangledRepoPullStatusClosed: 'sh.tangled.repo.pull.status.closed',
  ShTangledRepoPullComment: 'sh.tangled.repo.pull.comment',
  ShTangledRepoPullStatusMerged: 'sh.tangled.repo.pull.status.merged',
  ShTangledRepoPullStatusOpen: 'sh.tangled.repo.pull.status.open',
  ShTangledRepoPull: 'sh.tangled.repo.pull',
  ShTangledRepoPullStatus: 'sh.tangled.repo.pull.status',
  ShTangledRepoAddSecret: 'sh.tangled.repo.addSecret',
  ShTangledRepoArchive: 'sh.tangled.repo.archive',
  ShTangledRepoArtifact: 'sh.tangled.repo.artifact',
  ShTangledRepoBlob: 'sh.tangled.repo.blob',
  ShTangledRepoBranch: 'sh.tangled.repo.branch',
  ShTangledRepoBranches: 'sh.tangled.repo.branches',
  ShTangledRepoCollaborator: 'sh.tangled.repo.collaborator',
  ShTangledRepoCompare: 'sh.tangled.repo.compare',
  ShTangledRepoCreate: 'sh.tangled.repo.create',
  ShTangledRepoSetDefaultBranch: 'sh.tangled.repo.setDefaultBranch',
  ShTangledRepoDelete: 'sh.tangled.repo.delete',
  ShTangledRepoDeleteBranch: 'sh.tangled.repo.deleteBranch',
  ShTangledRepoDiff: 'sh.tangled.repo.diff',
  ShTangledRepoForkStatus: 'sh.tangled.repo.forkStatus',
  ShTangledRepoForkSync: 'sh.tangled.repo.forkSync',
  ShTangledRepoGetDefaultBranch: 'sh.tangled.repo.getDefaultBranch',
  ShTangledRepoHiddenRef: 'sh.tangled.repo.hiddenRef',
  ShTangledRepoLanguages: 'sh.tangled.repo.languages',
  ShTangledRepoListSecrets: 'sh.tangled.repo.listSecrets',
  ShTangledRepoLog: 'sh.tangled.repo.log',
  ShTangledRepoMerge: 'sh.tangled.repo.merge',
  ShTangledRepoMergeCheck: 'sh.tangled.repo.mergeCheck',
  ShTangledRepoRemoveSecret: 'sh.tangled.repo.removeSecret',
  ShTangledRepo: 'sh.tangled.repo',
  ShTangledRepoTag: 'sh.tangled.repo.tag',
  ShTangledRepoTags: 'sh.tangled.repo.tags',
  ShTangledRepoTree: 'sh.tangled.repo.tree',
  ShTangledSpindleMember: 'sh.tangled.spindle.member',
  ShTangledSpindle: 'sh.tangled.spindle',
  ShTangledString: 'sh.tangled.string',
} as const
