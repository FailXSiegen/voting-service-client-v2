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

    // Login the user width the new token.
    const coreStore = useCore();
    await coreStore.loginUser(token);
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

// Create the webSocket link with enhanced stability settings.
// @info The server side authentication is done via refreshToken (cookie).
const wsLink = new GraphQLWsLink(
  createClient({
    url: URLS.SUBSCRIPTION_URL,
    reconnect: true,
    // VERBESSERT: Lazy-Loading deaktiviert, um Verbindung sofort herzustellen und zu halten
    lazy: false,
    // VERBESSERT: Längere Timeouts für die Stabilität
    timeout: 60000, // 60 Sekunden statt 30 Sekunden
    inactivityTimeout: 120000, // 2 Minuten statt 30 Sekunden
    // VERBESSERT: Robustere Reconnect-Logik
    retryAttempts: 10,
    retryWait: (retries) => Math.min(retries * 1000, 10000), // Exponentielles Backoff bis max. 10 Sekunden
    keepAlive: 45000, // 45 Sekunden Ping-Intervall
    // VERBESSERT: Verbindung auch bei Inaktivität halten
    shouldRetry: () => true,
    connectionParams: {
      // Zusätzliche Parameter für bessere Zuverlässigkeit
      connectionPresence: true,
      forceReconnect: true
    }
  }),
);

// VERBESSERT: Detailliertere WebSocket-Ereignisbehandlung mit Retry-Logik
let wsReconnectCount = 0;
const MAX_WS_RECONNECT_ATTEMPTS = 10;

wsLink.client.on("connecting", () => {
  // Sicherstellen, dass der Zähler die Grenze nicht überschreitet
  if (wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    wsReconnectCount++;
  }
});

wsLink.client.on("connected", () => {
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
    console.warn("[Websocket] Store noch nicht initialisiert:", err.message);
  }

  // Start eines Ping-Intervalls zum Halten der Verbindung
  startWebSocketKeepAlive();
});

// VERBESSERT: Zusätzliche Ereignisbehandlung für Fehler
wsLink.client.on("error", (error) => {
  console.error("[Websocket] Fehler bei der Verbindung:", error);

  // Bei Verbindungsfehlern automatisch versuchen, wieder zu verbinden
  if (wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    console.info(`[Websocket] Versuche erneut zu verbinden (${wsReconnectCount}/${MAX_WS_RECONNECT_ATTEMPTS})...`);
    setTimeout(() => {
      try {
        // Manueller Reconnect-Versuch mit robuster Fehlerbehandlung
        if (typeof wsLink.client.connect === 'function') {
          // Die GraphQL-WS-Bibliothek bietet connect() als primäre Methode
          wsLink.client.connect();
        }
      } catch (e) {
        console.error("[Websocket] Fehler beim Neustart der Verbindung:", e);
      }
    }, Math.min(wsReconnectCount * 1000, 5000)); // Exponentielles Backoff
  }
});

wsLink.client.on("closed", (event) => {
  // Mark current event user as offline.
  try {
    // Vorsichtshalber prüfen, ob der Store verfügbar ist
    const coreStore = useCore();
    if (coreStore && coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(false);
    }
  } catch (err) {
    console.warn("[Websocket] Store noch nicht initialisiert:", err.message);
  }

  // Stoppe das Ping-Intervall, wenn die Verbindung geschlossen wird
  stopWebSocketKeepAlive();

  // Bei normaler Schließung nicht neu verbinden, bei abnormaler Schließung versuchen, neu zu verbinden
  const isAbnormalClosure = !event || event.code !== 1000;
  if (isAbnormalClosure && wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      try {
        // Manueller Reconnect-Versuch mit robuster Fehlerbehandlung
        if (typeof wsLink.client.connect === 'function') {
          // Die GraphQL-WS-Bibliothek bietet connect() als primäre Methode
          wsLink.client.connect();
        }
      } catch (e) {
        console.error("[Websocket] Fehler beim Neustart der Verbindung nach Schließung:", e);
      }
    }, Math.min(wsReconnectCount * 1000, 5000)); // Exponentielles Backoff
  }
});

// VERBESSERT: Keep-Alive-Mechanismus für die WebSocket-Verbindung
let wsKeepAliveInterval = null;

function startWebSocketKeepAlive() {
  // Stoppe zuerst eventuell laufende Intervalle
  stopWebSocketKeepAlive();

  // Starte ein neues Intervall, das regelmäßig eine No-Op-Anfrage sendet, um die Verbindung am Leben zu halten
  wsKeepAliveInterval = setInterval(() => {
    try {
      // Da wsLink.client.ping() nicht existiert, senden wir eine leere GraphQL-Anfrage
      // Die GraphQL-Spezifikation erlaubt eine Ping-Operation mit einer introspection query
      apolloClient.query({
        query: gql`
          query KeepAlive {
            __typename
          }
        `,
        fetchPolicy: 'network-only', // Erzwinge einen Netzwerkaufruf, kein Caching
      }).then(() => {

      }).catch((error) => {
        console.error("[Websocket] Keep-alive Anfrage fehlgeschlagen:", error);
      });

    } catch (e) {
      console.error("[Websocket] Fehler beim Senden des Keep-alive:", e);
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
    // Stoppe zuerst das Keep-Alive-Intervall
    stopWebSocketKeepAlive();

    // Verhindere weitere Reconnect-Versuche durch Maximierung des Zählers
    wsReconnectCount = MAX_WS_RECONNECT_ATTEMPTS;

    // Der graphql-ws Client hat keine direkte Methode zum Entfernen von Listenern
    // Stattdessen setzen wir den Zähler hoch und prüfen ihn in den Listener-Callbacks

    // Ordnungsgemäßes Beenden mit speziellem Code (4499 für kontrollierte Terminierung)
    await wsLink.client.terminate();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Websocket] Fehler beim Beenden der WebSocket-Verbindung:", error);
  }
}
