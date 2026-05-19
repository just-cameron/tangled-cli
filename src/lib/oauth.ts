import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { Agent } from '@atproto/api';
import { requestLocalLock } from '@atproto/oauth-client';
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
} from '@atproto/oauth-client-node';
import { buildAtprotoLoopbackClientMetadata } from '@atproto/oauth-types';
import open from 'open';
import {
  deleteOAuthSession,
  deleteOAuthState,
  loadOAuthSession,
  loadOAuthState,
  saveCurrentSessionMetadata,
  saveOAuthSession,
  saveOAuthState,
} from './session.js';

const CALLBACK_HOST = '127.0.0.1';
const CALLBACK_PATH = '/oauth/callback';
const DEFAULT_PORT = 43110;
const SCOPE = 'atproto transition:generic';

export interface OAuthLoginResult {
  did: string;
  handle: string;
  pds: string;
}

function createOAuthClient(redirectUri: string): NodeOAuthClient {
  return new NodeOAuthClient({
    clientMetadata: buildAtprotoLoopbackClientMetadata({
      scope: SCOPE,
      redirect_uris: [redirectUri],
    }),
    requestLock: requestLocalLock,
    stateStore: {
      async set(key: string, state: NodeSavedState): Promise<void> {
        await saveOAuthState(key, state);
      },
      async get(key: string): Promise<NodeSavedState | undefined> {
        return (await loadOAuthState(key)) ?? undefined;
      },
      async del(key: string): Promise<void> {
        await deleteOAuthState(key);
      },
    },
    sessionStore: {
      async set(sub: string, session: NodeSavedSession): Promise<void> {
        await saveOAuthSession(sub, session);
      },
      async get(sub: string): Promise<NodeSavedSession | undefined> {
        return (await loadOAuthSession(sub)) ?? undefined;
      },
      async del(sub: string): Promise<void> {
        await deleteOAuthSession(sub);
      },
    },
  });
}

function listen(server: ReturnType<typeof createServer>, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, CALLBACK_HOST, () => {
      server.off('error', reject);
      const address = server.address();
      if (typeof address === 'object' && address) resolve(address.port);
      else reject(new Error('Failed to bind OAuth callback server'));
    });
  });
}

export async function loginWithOAuth(identifier: string): Promise<OAuthLoginResult> {
  const state = randomUUID();
  let resolveCallback: (params: URLSearchParams) => void;
  let rejectCallback: (error: Error) => void;
  const callbackPromise = new Promise<URLSearchParams>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${CALLBACK_HOST}`);
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Authentication complete. You can close this tab and return to tang.');
      resolveCallback(url.searchParams);
    } catch (error) {
      rejectCallback(error instanceof Error ? error : new Error('OAuth callback failed'));
    }
  });

  const port = await listen(server, DEFAULT_PORT);
  const redirectUri = `http://${CALLBACK_HOST}:${port}${CALLBACK_PATH}`;
  const oauthClient = createOAuthClient(redirectUri);

  try {
    const authUrl = await oauthClient.authorize(identifier, { state, ui_locales: 'en' });
    console.log(`Opening browser for OAuth login: ${authUrl.toString()}`);
    await open(authUrl.toString());

    const params = await callbackPromise;
    const { session, state: returnedState } = await oauthClient.callback(params);
    if (returnedState !== state) {
      throw new Error('OAuth state mismatch');
    }

    const agent = new Agent(session);
    const profile = await agent.getProfile({ actor: session.did });
    const handle = profile.data.handle || session.did;
    const tokenInfo = await session.getTokenInfo(false);

    await saveCurrentSessionMetadata({
      handle,
      did: session.did,
      pds: tokenInfo.aud,
      authType: 'oauth',
      lastUsed: new Date().toISOString(),
    });

    return { did: session.did, handle, pds: tokenInfo.aud };
  } finally {
    server.close();
  }
}

export async function restoreOAuthAgent(did: string, pds: string): Promise<Agent> {
  const redirectUri = `http://${CALLBACK_HOST}:${DEFAULT_PORT}${CALLBACK_PATH}`;
  const oauthClient = createOAuthClient(redirectUri);
  const session = await oauthClient.restore(did);
  const tokenInfo = await session.getTokenInfo('auto');
  await saveCurrentSessionMetadata({
    handle: did,
    did,
    pds: tokenInfo.aud || pds,
    authType: 'oauth',
    lastUsed: new Date().toISOString(),
  });
  return new Agent(session);
}
