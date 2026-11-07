import { ApolloClient, split, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { logErrorMessages } from '@vue/apollo-util';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { decodeJsonWebToken } from '@/core/auth/jwt-util';
import { getCurrentUnixTimeStamp } from '@/core/util/time-stamp';
import { refreshLogin, logout } from '@/core/auth/login';
import { handleError } from '@/core/error/error-handler';
import { setContext } from '@apollo/client/link/context';
import { useCore } from '@/core/store/core';
import { NetworkError } from '@/core/error/NetworkError';
import { UnauthorizedError } from '@/core/error/UnauthorizedError';
import { GraphQLError } from '@/core/error/GraphQLError';
import { ExpiredSessionError } from '@/core/error/ExpiredSessionError';
import { URLS } from '@/urls';

export const AUTH_TOKEN = 'apollo-token';
export const EVENT_USER_AUTH_TOKEN = 'eventUserAuthToken';

function getAccessToken() {
  if (typeof window.localStorage === 'undefined') {
    throw new Error('Missing LocalStorage object, but it is required.');
  }
  return localStorage.getItem(AUTH_TOKEN);
}

// Renew the JWT this many seconds before it expires (lifetime is 15 min since SEC-25).
const TOKEN_RENEWAL_MARGIN = 30;
let pendingRefresh = null;

function isTokenFresh(token) {
  try {
    const { payload } = decodeJsonWebToken(token);
    return payload?.exp > getCurrentUnixTimeStamp() + TOKEN_RENEWAL_MARGIN;
  } catch (error) {
    return false;
  }
}

/**
 * Returns a valid access token, renewing it via the refresh cookie when it is (about to be)
 * expired. Parallel callers share one refresh request. Returns null without a session.
 *
 * @returns {Promise<string|null>}
 */
export async function getFreshAccessToken() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }
  if (isTokenFresh(accessToken)) {
    return accessToken;
  }
  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      try {
        const { token } = await refreshLogin();
        if (!token) {
          return null;
        }
        // Same user: only stores the token, keeps websocket and cache (see core.js loginUser).
        await useCore().loginUser(token, true);
        return token;
      } catch (error) {
        console.error('[Auth] Token refresh failed:', error?.message);
        localStorage.removeItem(AUTH_TOKEN);
        return null;
      } finally {
        pendingRefresh = null;
      }
    })();
  }
  return pendingRefresh;
}

// Adds a fresh access token to every HTTP request.
const authLink = setContext(async (_, { headers }) => {
  const accessToken = await getFreshAccessToken();
  if (!accessToken) {
    return { headers };
  }
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${accessToken}`,
    },
  };
});

// Create the http link.
const httpLink = new HttpLink({
  uri: URLS.GRAPHQL_ENDPOINT,
});

// Create the webSocket link.
// SEC-16: The server authenticates the connection once (connectionParams) and rejects it with
// 4403 without a valid token. Therefore lazy: the socket only opens when the first subscription
// starts (after login), and every (re)connect takes a fresh token, so reconnects after the
// 15-minute JWT lifetime still work during a running poll.
const wsLink = new GraphQLWsLink(
  createClient({
    url: URLS.SUBSCRIPTION_URL,
    lazy: true,
    // Keep the socket for a moment when the last subscription ends (route changes).
    lazyCloseTimeout: 3000,
    retryAttempts: 10,
    retryWait: (retries) =>
      new Promise((resolve) => setTimeout(resolve, Math.min((retries + 1) * 1000, 10000))),
    keepAlive: 45000,
    shouldRetry: () => true,
    connectionParams: async () => {
      const accessToken = await getFreshAccessToken();
      return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
    },
  })
);

// VERBESSERT: Detailliertere WebSocket-Ereignisbehandlung mit Retry-Logik
let wsReconnectCount = 0;
const MAX_WS_RECONNECT_ATTEMPTS = 10;

wsLink.client.on('connecting', () => {
  // Sicherstellen, dass der Zähler die Grenze nicht überschreitet
  if (wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    wsReconnectCount++;
  }
});

wsLink.client.on('connected', () => {
  // Zurücksetzen des Reconnect-Zählers bei erfolgreicher Verbindung
  wsReconnectCount = 0;

  // Mark current event user as online.
  try {
    // Vorsichtshalber prüfen, ob der Store verfügbar ist
    const coreStore = useCore();
    if (coreStore && coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(true);
    }
  } catch (err) {
    console.warn('[Websocket] Store noch nicht initialisiert:', err.message);
  }

  // Start eines Ping-Intervalls zum Halten der Verbindung
  // DISABLED: Causes issues on Safari/Mac with race conditions during voting
  // startWebSocketKeepAlive();
});

// graphql-ws reconnects by itself (retryAttempts/shouldRetry above).
wsLink.client.on('error', (error) => {
  console.error('[Websocket] Fehler bei der Verbindung:', error?.message ?? error);
});

wsLink.client.on('closed', () => {
  // Mark current event user as offline.
  try {
    // Vorsichtshalber prüfen, ob der Store verfügbar ist
    const coreStore = useCore();
    if (coreStore && coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(false);
    }
  } catch (err) {
    console.warn('[Websocket] Store noch nicht initialisiert:', err.message);
  }

  // Stoppe das Ping-Intervall, wenn die Verbindung geschlossen wird
  stopWebSocketKeepAlive();
});

// VERBESSERT: Keep-Alive-Mechanismus für die WebSocket-Verbindung
let wsKeepAliveInterval = null;

// eslint-disable-next-line no-unused-vars
function startWebSocketKeepAlive() {
  // Stoppe zuerst eventuell laufende Intervalle
  stopWebSocketKeepAlive();

  // Starte ein neues Intervall, das regelmäßig eine No-Op-Anfrage sendet, um die Verbindung am Leben zu halten
  wsKeepAliveInterval = setInterval(() => {
    try {
      // Prüfen, ob die apolloClient Variable existiert
      // (sie wird später in der Datei definiert, könnte hier noch nicht verfügbar sein)
      if (typeof apolloClient !== 'undefined') {
        // Da wsLink.client.ping() nicht existiert, senden wir eine leere GraphQL-Anfrage
        // Die GraphQL-Spezifikation erlaubt eine Ping-Operation mit einer introspection query
        apolloClient
          .query({
            query: gql`
              query KeepAlive {
                __typename
              }
            `,
            fetchPolicy: 'network-only', // Erzwinge einen Netzwerkaufruf, kein Caching
            context: {
              credentials: 'include', // Cookies auch beim Keep-Alive mitsenden
            },
          })
          .then(() => {
            // Erfolgreicher Keep-Alive, Updates für den Online-Status
            try {
              const coreStore = useCore();
              if (coreStore && coreStore.isActiveEventUserSession) {
                coreStore.setEventUserOnlineState(true);

                // Nach erfolgreicher Keep-Alive-Anfrage auch die letzte Aktivitätszeit aktualisieren,
                // um zu verhindern, dass der Inactivity-Cleanup-Service den Benutzer als offline markiert
                // (Da dieser eine 15-Minuten-Grenze verwendet - siehe inactivity-cleanup.js)
                const now = Math.floor(Date.now() / 1000); // Unix-Timestamp in Sekunden
                localStorage.setItem('lastActiveTimestamp', now.toString());
              }
            } catch (storeError) {
              console.warn('[Websocket] Keep-Alive Store-Update fehlgeschlagen:', storeError);
            }
          })
          .catch((error) => {
            console.error('[Websocket] Keep-alive Anfrage fehlgeschlagen:', error);
          });
      }
    } catch (e) {
      console.error('[Websocket] Fehler beim Senden des Keep-alive:', e);
    }
  }, 30000); // Alle 30 Sekunden
}

function stopWebSocketKeepAlive() {
  if (wsKeepAliveInterval) {
    clearInterval(wsKeepAliveInterval);
    wsKeepAliveInterval = null;
  }
}

// Create the Error link.
// IMPORTANT: This callback must NOT be async. Apollo's onError treats any truthy
// return value as an Observable and calls .subscribe() on it. An async function
// always returns a Promise, which would trigger "o.subscribe is not a function"
// during error handling (e.g. when bulk-creating participants and one already exists).
const errorLink = onError((error) => {
  // Log errors to console in DEV environments.
  if (import.meta.env.DEV) {
    logErrorMessages(error);
  }

  // Handle graphQL errors.
  if (error?.graphQLErrors) {
    for (const graphQLError of error.graphQLErrors) {
      handleError(new GraphQLError(graphQLError));
    }
    return;
  }

  // Handle network errors.
  if (error?.networkError) {
    if (error.networkError?.statusCode === 401) {
      handleError(new UnauthorizedError());
    }

    if (error.networkError?.type === ExpiredSessionError.type) {
      // Session is invalid, so return to main login.
      handleError(new NetworkError(error.networkError.message));
      // Fire-and-forget: must not return a Promise from onError.
      logout().catch((e) => console.error('[Apollo] logout failed:', e));
      return;
    }

    handleError(new NetworkError(error.networkError.message));
    return;
  }

  // Handle undefined errors.
  handleError(new NetworkError(error?.networkError?.message));
});

// Create the apollo client.
export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: errorLink.concat(
    split(
      // split based on operation type
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      wsLink,
      authLink.concat(httpLink)
    )
  ),
});

export async function resetClient() {
  try {
    await apolloClient.resetStore();
  } catch (error) {
    console.error(error);
  }
}

// FIX: Erweiterte terminateClient-Funktion mit Logout-Parameter
export async function terminateClient(isLogout = false) {
  try {
    // Stop queries/subscriptions first, so no subscription reconnects without a token.
    apolloClient.stop();
    await apolloClient.clearStore();
    await terminateWebsocketClient(isLogout);
  } catch (error) {
    console.error(error);
  }
}

// FIX: Erweiterte terminateWebsocketClient-Funktion mit Logout-Parameter
// eslint-disable-next-line no-unused-vars
export async function terminateWebsocketClient(isLogout = false) {
  try {
    stopWebSocketKeepAlive();
    wsReconnectCount = MAX_WS_RECONNECT_ATTEMPTS;
    // Close code 4499; graphql-ws reconnects active subscriptions (fresh token via connectionParams).
    wsLink.client.terminate();
  } catch (error) {
    console.error('[Websocket] Fehler beim Beenden der WebSocket-Verbindung:', error);
  }
}

/**
 * Closes the websocket; graphql-ws reopens it for the active subscriptions with the token
 * from connectionParams (lazy client: otherwise with the next subscription).
 */
export function restartWebsocket() {
  wsReconnectCount = 0;
  wsLink.client.terminate();
}

/**
 * Reconnects the websocket (new connection with a fresh token) and refetches the active
 * queries. graphql-ws restarts all active subscriptions after terminate() by itself; with no
 * active subscription (lazy client) the next subscription opens the connection.
 * Only for real (re)logins and when a tab becomes visible again, not for token renewals.
 */
export async function reconnectWebsocketClient() {
  try {
    restartWebsocket();
    await apolloClient.resetStore();
    return true;
  } catch (error) {
    console.error('[Websocket] Fehler bei der Verbindungswiederherstellung:', error);
    throw error;
  }
}
