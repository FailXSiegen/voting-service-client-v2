import {
  ApolloClient,
  split,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  gql,
} from "@apollo/client/core";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { decodeJsonWebToken } from "@/core/auth/jwt-util";
import { getCurrentUnixTimeStamp } from "@/core/util/time-stamp";
import { refreshLogin } from "@/core/auth/login";
import { handleError } from "@/core/error/error-handler";
import { setContext } from "apollo-link-context";
import { useCore } from "@/core/store/core";
import { NetworkError } from "@/core/error/NetworkError";
import { UnauthorizedError } from "@/core/error/UnauthorizedError";
import { GraphQLError } from "@/core/error/GraphQLError";
import { ExpiredSessionError } from "@/core/error/ExpiredSessionError";
import { URLS } from "@/urls";
import { logout } from "@/core/auth/login";

export const AUTH_TOKEN = "apollo-token";
export const EVENT_USER_AUTH_TOKEN = "eventUserAuthToken";
export const REFRESH_TOKEN = "refreshToken";

// Browser-Erkennung für mobile-spezifische Optimierungen
const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

function getAccessToken() {
  if (typeof window.localStorage === "undefined") {
    throw new Error("Missing LocalStorage object, but it is required.");
  }
  return localStorage.getItem(AUTH_TOKEN);
}

// Create link to add authorization to the headers.
const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  operation.setContext({
    headers: {
      authorization: accessToken ? `Bearer ${accessToken}` : null,
    },
  });

  return forward(operation);
});

const refreshTokenLink = setContext(async () => {
  // Get the access token.
  const accessToken = getAccessToken();
  if (accessToken === null) {
    // No access token found, so we just forward.
    return;
  }

  // Compare access token expiry date time with the current date time.
  try {
    const { payload } = decodeJsonWebToken(accessToken);
    const currentTime = getCurrentUnixTimeStamp();
    if (payload?.exp > currentTime) {
      // The access token is still valid, so we just forward.
      return;
    }
  } catch (error) {
    // We do not have to catch the error here because if we have an error, the access token is invalid any ways.
    console.error("RefreshTokenLink - Error decoding token:", error);
  }

  try {
    // The token is invalid, so we request a new one.
    const { token } = await refreshLogin();

    // Login the user with the new token and mark as token refresh.
    const coreStore = useCore();
    await coreStore.loginUser(token, true);
  } catch (error) {
    console.error("RefreshTokenLink - Failed to refresh token:", error);
    // If refresh fails, remove the token
    localStorage.removeItem(AUTH_TOKEN);
  }
});

// Create the http link.
const httpLink = new HttpLink({
  uri: URLS.GRAPHQL_ENDPOINT,
  fetch: (uri, options) => {
    // options.headers = getHeaders();
    return fetch(uri, options);
  },
});

// Mobile/Safari-optimierte WebSocket-Konfiguration
const getWebSocketConfig = () => {
  const baseConfig = {
    url: URLS.SUBSCRIPTION_URL,
    reconnect: true,
    lazy: true, // OPTIMIERT: Lazy loading für bessere Stabilität
    timeout: 20000, // OPTIMIERT: Kürzerer Timeout (20s statt 60s)
    inactivityTimeout: 60000, // OPTIMIERT: 1 Minute statt 2 Minuten
    retryAttempts: 3, // OPTIMIERT: Weniger Retry-Versuche (3 statt 10)
    retryWait: (retries) => Math.min(retries * 3000, 15000), // OPTIMIERT: Langsameres Backoff
    keepAlive: 180000, // OPTIMIERT: Keep-Alive alle 3 Minuten statt 45s
    shouldRetry: (closeEvent) => {
      // OPTIMIERT: Nicht bei allen Fehlern retry
      if (!closeEvent) return true;
      // Normale Schließung oder User-initiated close
      if (closeEvent.code === 1000 || closeEvent.code === 1001) return false;
      // Zu viele Reconnect-Versuche
      if (wsReconnectCount >= MAX_WS_RECONNECT_ATTEMPTS) return false;
      return true;
    },
    isFatalConnectionProblem: () => false,
    connectionParams: async () => {
      let authParams = {
        connectionPresence: true,
        forceReconnect: false // OPTIMIERT: Weniger aggressive Reconnects
      };

      try {
        const accessToken = localStorage.getItem(AUTH_TOKEN);
        if (accessToken) {
          authParams.authorization = `Bearer ${accessToken}`;
        } else {
          console.warn('[Websocket] Kein Auth-Token im localStorage gefunden!');
        }
      } catch (e) {
        console.warn('[Websocket] Fehler beim Abrufen des Auth-Tokens:', e);
      }

      return authParams;
    }
  };

  // Mobile-spezifische Anpassungen
  if (isMobile) {
    return {
      ...baseConfig,
      timeout: 15000, // Noch kürzer für Mobile
      keepAlive: 300000, // 5 Minuten für Mobile
      retryAttempts: 2, // Nur 2 Versuche für Mobile
      inactivityTimeout: 30000, // 30s für Mobile
    };
  }

  // Safari-spezifische Anpassungen
  if (isSafari) {
    return {
      ...baseConfig,
      keepAlive: 240000, // 4 Minuten für Safari
      shouldRetry: (closeEvent) => {
        // Safari: Noch weniger Retries
        return closeEvent && closeEvent.code !== 1000 && closeEvent.code !== 1001 && wsReconnectCount < 2;
      }
    };
  }

  return baseConfig;
};

// Create the webSocket link with mobile-optimized settings
const wsLink = new GraphQLWsLink(createClient(getWebSocketConfig()));

// OPTIMIERT: Weniger aggressive Reconnect-Logik
let wsReconnectCount = 0;
const MAX_WS_RECONNECT_ATTEMPTS = isMobile ? 2 : 3; // Mobile: noch weniger Versuche

wsLink.client.on("connecting", () => {
  if (wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    wsReconnectCount++;
  }
  console.info(`[Websocket] Verbindungsaufbau (Versuch ${wsReconnectCount}/${MAX_WS_RECONNECT_ATTEMPTS})`);
});

wsLink.client.on("connected", () => {
  wsReconnectCount = 0;
  console.info("[Websocket] Erfolgreich verbunden");

  // Mark current event user as online.
  try {
    const coreStore = useCore();
    if (coreStore && coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(true);
    }
  } catch (err) {
    console.warn("[Websocket] Store noch nicht initialisiert:", err.message);
  }

  // OPTIMIERT: Sanfterer Keep-Alive-Start
  startWebSocketKeepAlive();
});

wsLink.client.on("error", (error) => {
  console.error("[Websocket] Verbindungsfehler:", error);

  // OPTIMIERT: Längere Wartezeit vor Reconnect
  if (wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    const backoffTime = Math.min(wsReconnectCount * 5000, 30000); // 5s, 10s, 15s...
    console.info(`[Websocket] Reconnect in ${backoffTime/1000}s (${wsReconnectCount}/${MAX_WS_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
      try {
        if (typeof wsLink.client.connect === 'function') {
          wsLink.client.connect();
        }
      } catch (e) {
        console.error("[Websocket] Fehler beim Neustart der Verbindung:", e);
      }
    }, backoffTime);
  } else {
    console.warn("[Websocket] Maximale Reconnect-Versuche erreicht");
  }
});

wsLink.client.on("closed", (event) => {
  console.info("[Websocket] Verbindung geschlossen", event?.code, event?.reason);

  // Mark current event user as offline.
  try {
    const coreStore = useCore();
    if (coreStore && coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(false);
    }
  } catch (err) {
    console.warn("[Websocket] Store noch nicht initialisiert:", err.message);
  }

  stopWebSocketKeepAlive();

  // OPTIMIERT: Sanftere Reconnect-Logik
  const isNormalClosure = event && (event.code === 1000 || event.code === 1001);
  if (!isNormalClosure && wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    const backoffTime = Math.min(wsReconnectCount * 5000, 30000);
    setTimeout(() => {
      try {
        if (typeof wsLink.client.connect === 'function') {
          wsLink.client.connect();
        }
      } catch (e) {
        console.error("[Websocket] Fehler beim Neustart nach Schließung:", e);
      }
    }, backoffTime);
  }
});

// OPTIMIERT: Dynamischer Keep-Alive basierend auf Browser/Gerät
let wsKeepAliveInterval = null;
const getKeepAliveInterval = () => {
  if (isIOS) return 180000; // 3 Minuten für iOS
  if (isMobile) return 120000; // 2 Minuten für andere Mobile
  if (isSafari) return 150000; // 2.5 Minuten für Safari
  return 90000; // 1.5 Minuten für Desktop
};

function startWebSocketKeepAlive() {
  stopWebSocketKeepAlive();

  const keepAliveInterval = getKeepAliveInterval();
  console.info(`[Websocket] Keep-Alive gestartet (Intervall: ${keepAliveInterval/1000}s)`);

  wsKeepAliveInterval = setInterval(() => {
    // OPTIMIERT: Nur senden wenn Tab aktiv ist
    if (document.hidden) {
      console.debug("[Websocket] Keep-Alive übersprungen (Tab nicht aktiv)");
      return;
    }

    try {
      if (typeof apolloClient !== 'undefined') {
        apolloClient.query({
          query: gql`
            query KeepAlive {
              __typename
            }
          `,
          fetchPolicy: 'network-only',
          context: {
            credentials: 'include',
          }
        }).then(() => {
          try {
            const coreStore = useCore();
            if (coreStore && coreStore.isActiveEventUserSession) {
              coreStore.setEventUserOnlineState(true);
              const now = Math.floor(Date.now() / 1000);
              localStorage.setItem('lastActiveTimestamp', now.toString());
            }
          } catch (storeError) {
            console.warn("[Websocket] Keep-Alive Store-Update fehlgeschlagen:", storeError);
          }
        }).catch((error) => {
          console.error("[Websocket] Keep-alive Anfrage fehlgeschlagen:", error);
        });
      }
    } catch (e) {
      console.error("[Websocket] Fehler beim Senden des Keep-alive:", e);
    }
  }, keepAliveInterval);
}

function stopWebSocketKeepAlive() {
  if (wsKeepAliveInterval) {
    clearInterval(wsKeepAliveInterval);
    wsKeepAliveInterval = null;
    console.debug("[Websocket] Keep-Alive gestoppt");
  }
}

// OPTIMIERT: Page Visibility API für besseres Mobile-Verhalten
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.info("[Websocket] Tab wird unsichtbar - Keep-Alive pausiert");
      stopWebSocketKeepAlive();
    } else {
      console.info("[Websocket] Tab wieder sichtbar - Keep-Alive fortgesetzt");
      startWebSocketKeepAlive();
    }
  });

  // OPTIMIERT: Für Mobile - Verbindung bei App-Pause/Resume
  window.addEventListener('pagehide', () => {
    console.info("[Websocket] App wird pausiert");
    stopWebSocketKeepAlive();
  });

  window.addEventListener('pageshow', () => {
    console.info("[Websocket] App wieder aktiv");
    if (!document.hidden) {
      startWebSocketKeepAlive();
    }
  });
}

// Create the Error link.
const errorLink = onError(async (error) => {
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
      await logout();
      return;
    }

    handleError(new NetworkError(error.networkError.message));
    return;
  }

  // Handle undefined errors.
  handleError(new NetworkError(error.networkError.message));
});

// Create the apollo client.
export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: errorLink.concat(
    split(
      // split based on operation type
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      authLink.concat(refreshTokenLink.concat(wsLink)),
      authLink.concat(refreshTokenLink.concat(httpLink)),
    ),
  ),
});

export async function resetClient() {
  try {
    await apolloClient.resetStore();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

export async function terminateClient() {
  try {
    await terminateWebsocketClient();
    await apolloClient.clearStore();
    apolloClient.stop();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

export async function terminateWebsocketClient() {
  try {
    console.info("[Websocket] Websocket-Client wird beendet");
    stopWebSocketKeepAlive();
    wsReconnectCount = MAX_WS_RECONNECT_ATTEMPTS;
    await wsLink.client.terminate();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Websocket] Fehler beim Beenden der WebSocket-Verbindung:", error);
  }
}

export async function reconnectWebsocketClient() {
  try {
    console.info("[Websocket] Starte WebSocket-Neuverbindung");

    // OPTIMIERT: Sanfterer Reconnect
    wsReconnectCount = 0;

    try {
      if (wsLink && wsLink.client) {
        await wsLink.client.terminate();
        console.info("[Websocket] Bestehende Verbindung beendet");
      }

      // OPTIMIERT: Längere Wartezeit für Stabilität
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (wsLink && wsLink.client && typeof wsLink.client.connect === 'function') {
        await wsLink.client.connect();
        console.info("[Websocket] Neue Verbindung gestartet");
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (wsError) {
      console.error("[Websocket] Fehler beim Neuaufbau:", wsError);
    }

    // OPTIMIERT: Sanfteres Keep-Alive nach Reconnect
    try {
      await apolloClient.query({
        query: gql`
          query KeepAlive {
            __typename
          }
        `,
        fetchPolicy: 'network-only',
        context: {
          credentials: 'include',
        }
      });
      console.info("[Websocket] Keep-Alive nach Reconnect erfolgreich");
    } catch (keepAliveError) {
      console.error("[Websocket] Keep-Alive nach Reconnect fehlgeschlagen:", keepAliveError);
    }

    startWebSocketKeepAlive();
    await apolloClient.resetStore();

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Websocket] Fehler bei der Verbindungswiederherstellung:", error);
    throw error;
  }
  }
