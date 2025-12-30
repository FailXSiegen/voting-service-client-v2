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

// Create the webSocket link with enhanced stability settings.
// @info Die Server-Authentifizierung wird über den accessToken (JWT) im localStorage gemacht
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
    // VERBESSERT: Opera-kompatible Authentifizierung über localStorage statt Cookies
    isFatalConnectionProblem: () => false,
    connectionParams: async () => {
      // Verwende JWT aus localStorage für die Authentifizierung
      let authParams = {
        connectionPresence: true,
        forceReconnect: true
      };

      try {
        // PRIMÄR: Auth Token aus localStorage verwenden (für alle Browser)
        const accessToken = localStorage.getItem(AUTH_TOKEN);
        if (accessToken) {
          // Standard JWT-Authentifizierungs-Header
          authParams.authorization = `Bearer ${accessToken}`;
        } else {
          console.warn('[Websocket] Kein Auth-Token im localStorage gefunden!');
        }
      } catch (e) {
        console.warn('[Websocket] Fehler beim Abrufen des Auth-Tokens:', e);
      }

      return authParams;
    }
  }),
);

// VERBESSERT: Detailliertere WebSocket-Ereignisbehandlung mit Retry-Logik
let wsReconnectCount = 0;
const MAX_WS_RECONNECT_ATTEMPTS = 10;
// FIX: Flag für Logout-Status um 4499-Toasts zu vermeiden
let isLogoutInProgress = false;

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
  // DISABLED: Causes issues on Safari/Mac with race conditions during voting
  // startWebSocketKeepAlive();
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

  // FIX: Erweiterte Prüfung für kontrollierte Schließung (inkl. Code 4499 vom Logout)
  const isControlledClosure = !event || 
    event.code === 1000 ||  // Normal closure
    event.code === 1001 ||  // Going away
    event.code === 4499 ||  // UNSERE kontrollierte Terminierung beim Logout
    isLogoutInProgress;     // Logout-Flag gesetzt

  // Nur bei wirklich abnormaler Schließung versuchen, neu zu verbinden
  if (!isControlledClosure && wsReconnectCount < MAX_WS_RECONNECT_ATTEMPTS) {
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
        apolloClient.query({
          query: gql`
            query KeepAlive {
              __typename
            }
          `,
          fetchPolicy: 'network-only', // Erzwinge einen Netzwerkaufruf, kein Caching
          context: {
            credentials: 'include', // Cookies auch beim Keep-Alive mitsenden
          }
        }).then(() => {
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
            console.warn("[Websocket] Keep-Alive Store-Update fehlgeschlagen:", storeError);
          }
        }).catch((error) => {
          console.error("[Websocket] Keep-alive Anfrage fehlgeschlagen:", error);
        });
      }

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
    return null;
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
      return null;
    }

    handleError(new NetworkError(error.networkError.message));
    return null;
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

// FIX: Erweiterte terminateClient-Funktion mit Logout-Parameter
export async function terminateClient(isLogout = false) {
  try {
    await terminateWebsocketClient(isLogout);
    await apolloClient.clearStore();
    apolloClient.stop();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

// FIX: Erweiterte terminateWebsocketClient-Funktion mit Logout-Parameter
export async function terminateWebsocketClient(isLogout = false) {
  try {
    // FIX: Setze Logout-Flag um Toasts zu vermeiden
    if (isLogout) {
      isLogoutInProgress = true;
    }

    // Stoppe zuerst das Keep-Alive-Intervall
    stopWebSocketKeepAlive();

    // Verhindere weitere Reconnect-Versuche durch Maximierung des Zählers
    wsReconnectCount = MAX_WS_RECONNECT_ATTEMPTS;

    // Der graphql-ws Client hat keine direkte Methode zum Entfernen von Listenern
    // Stattdessen setzen wir den Zähler hoch und prüfen ihn in den Listener-Callbacks

    // Ordnungsgemäßes Beenden mit speziellem Code (4499 für kontrollierte Terminierung)
    await wsLink.client.terminate();

    // FIX: Reset Logout-Flag nach kurzer Verzögerung
    if (isLogout) {
      setTimeout(() => {
        isLogoutInProgress = false;
      }, 1000);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Websocket] Fehler beim Beenden der WebSocket-Verbindung:", error);
    
    // FIX: Reset auch bei Fehler
    if (isLogout) {
      isLogoutInProgress = false;
    }
  }
}

export async function reconnectWebsocketClient() {
  try {
    console.info("[Websocket] Starte vollständige WebSocket-Neuverbindung");

    // 1. Setze den Reconnect-Zähler zurück, damit neue Verbindungsversuche möglich sind
    wsReconnectCount = 0;

    // 2. Vollständiger Neuaufbau der WebSocket-Verbindung durch schließen und neu öffnen
    try {
      // Zuerst bestehende Verbindung vollständig beenden (WICHTIG!)
      if (wsLink && wsLink.client) {
        await wsLink.client.terminate();
        console.info("[Websocket] Bestehende Verbindung beendet");
      }

      // 3. Verbindung explizit neu aufbauen (das Wichtigste für die Wiederherstellung des Online-Status)
      if (wsLink && wsLink.client && typeof wsLink.client.connect === 'function') {
        await wsLink.client.connect();
        console.info("[Websocket] Neue Verbindung explizit gestartet");
      }

      // 4. Warte kurz, damit die WebSocket-Verbindung vollständig aufgebaut werden kann
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (wsError) {
      console.error("[Websocket] Fehler beim Neuaufbau der WebSocket-Verbindung:", wsError);
    }

    // 5. Sende sofort ein Keep-Alive-Signal, um den Online-Status zu aktualisieren
    // DISABLED: Causes issues on Safari/Mac with race conditions during voting
    // try {
    //   await apolloClient.query({
    //     query: gql`
    //       query KeepAlive {
    //         __typename
    //       }
    //     `,
    //     fetchPolicy: 'network-only', // Erzwinge einen Netzwerkaufruf, kein Caching
    //     context: {
    //       credentials: 'include', // Sicherstellen, dass Cookies bei der HTTP-Anfrage gesendet werden
    //     }
    //   });
    //   console.info("[Websocket] Sofortiges Keep-Alive nach Verbindungsaufbau gesendet");
    // } catch (keepAliveError) {
    //   console.error("[Websocket] Fehler beim Senden des sofortigen Keep-Alive:", keepAliveError);
    // }

    // 6. Starte ein neues Keep-Alive-Intervall für zukünftige Pings
    // DISABLED: Causes issues on Safari/Mac with race conditions during voting
    // startWebSocketKeepAlive();

    // 7. Aktualisiere den Apollo-Store, um sicherzustellen, dass alle Abonnements wieder aktiv sind
    await apolloClient.resetStore();

    // 8. Logge die Cookie-Verfügbarkeit für Debugging-Zwecke
    try {
      console.info("[Websocket] Cookie-Status:", document.cookie ? "Cookies vorhanden" : "Keine Cookies verfügbar");
    } catch (e) {
      console.warn("[Websocket] Cookie-Status konnte nicht geprüft werden:", e);
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Websocket] Allgemeiner Fehler bei der Verbindungswiederherstellung:", error);
    throw error;
  }
}
