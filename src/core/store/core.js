import { defineStore } from "pinia";
import {
  apolloClient,
  AUTH_TOKEN,
  EVENT_USER_AUTH_TOKEN,
  resetClient,
  terminateClient,
} from "@/apollo-client";
import { decodeJsonWebToken } from "@/core/auth/jwt-util";
import { getCurrentUnixTimeStamp } from "@/core/util/time-stamp";
import {
  loginByEventUserAuthToken,
  refreshLogin,
  logout,
  USER_TYPE_EVENT_USER,
  USER_TYPE_ORGANIZER,
} from "@/core/auth/login";
import { provideApolloClient, useQuery } from "@vue/apollo-composable";
import { ORGANIZER } from "@/modules/organizer/graphql/queries/organizer";
import { EVENT_USER } from "@/modules/eventUser/graphql/queries/event-user";
import { reactive, ref } from "vue";
import { getCookie } from "../util/cookie";
import { handleError } from "../error/error-handler";
import { EventUserNotFoundError } from "@/core/error/EventUserNotFoundError";
import gql from 'graphql-tag';

class StyleManager {
  static setDynamicVariable(name, value) {
    document.documentElement.style.setProperty(`--${name}`, value);
  }

  static cleanStyles(styles) {
    // Ensures we have a clean object with only valid properties
    const cleanObject = {};
    Object.entries(styles).forEach(([key, value]) => {
      if (typeof key === 'string' && isNaN(parseInt(key))) {
        cleanObject[key] = value;
      }
    });
    return cleanObject;
  }

  static updateEventStyles(styles) {
    const cleanStyles = this.cleanStyles(styles);
    Object.entries(cleanStyles).forEach(([key, value]) => {
      this.setDynamicVariable(key, value);
    });
    return cleanStyles;
  }

  static resetStyles(styles) {
    Object.keys(styles).forEach(key => {
      document.documentElement.style.removeProperty(`--${key}`);
    });
  }
}

export const useCore = defineStore("core", {
  state: () => ({
    user: {
      type: null,
      id: null,
      role: null,
      verified: null,
      expiresAt: null,
    },
    event: reactive({}),
    organizer: ref({}),
    eventUser: ref({}),
    eventUserAuthorizedViaToken: false,
    eventStyles: {},
    // Authentication state tracking
    isInitialized: false,
    authInitPromise: null,
    lastTokenRefresh: null,
    // Konfigurationsoptionen für statische Seiten (werden vom Server geladen)
    systemSettings: {
      useDirectStaticPaths: false,
      useDbFooterNavigation: false
    },
  }),
  getters: {
    isActiveOrganizerSession: (state) => {
      const isActive = state.user?.id > 0 && state.user?.type === USER_TYPE_ORGANIZER;
      return isActive;
    },
    isActiveEventUserSession: (state) => {
      const isActive = state.user?.id > 0 && state.user?.type === USER_TYPE_EVENT_USER;
      return isActive;
    },
    getActiveUserRole: (state) => {
      return state.user?.role;
    },
    getActiveUserName: (state) => state.user,
    getOrganizer: (state) => state.organizer.value,
    getEventUser: (state) => state.eventUser.value,
    getEvent: (state) => state.event,
    isSuperOrganizer: (state) => {
      const isSuper = state.user?.type === USER_TYPE_ORGANIZER &&
        state.organizer.value?.superAdmin === true;
      return isSuper;
    },
    isEventUserAuthorizedViaToken: (state) =>
      state.eventUserAuthorizedViaToken === true,
    getAuthToken: () => {
      const token = localStorage.getItem(AUTH_TOKEN);
      return token;
    },
    getLastTokenRefresh: (state) => state.lastTokenRefresh,
    getCurrentEventStyles: (state) => state.eventStyles,
    // Getter für die globalen Systemeinstellungen
    getUseDirectStaticPaths: (state) => state.systemSettings?.useDirectStaticPaths || false,
    getUseDbFooterNavigation: (state) => state.systemSettings?.useDbFooterNavigation || false,
  },
  actions: {
    /**
     * Waits for authentication to be initialized before proceeding
     * This is crucial for router guards to ensure auth state is ready
     * @returns {Promise<boolean>} Promise that resolves when auth is initialized
     */
    async waitForAuth() {
      // If already initialized, return immediately
      if (this.isInitialized) {
        return true;
      }

      // If initialization is in progress, wait for it
      if (this.authInitPromise) {
        await this.authInitPromise;
        return true;
      }

      // If not initialized and not in progress, initialize auth
      this.authInitPromise = this.init();
      await this.authInitPromise;
      return true;
    },

    async init() {
      // Check if window.localStorage is available.
      if (typeof window.localStorage === "undefined") {
        console.error("Missing LocalStorage object, but it is required.");
        throw new Error("Missing LocalStorage object, but it is required.");
      }

      // Lade die globalen Systemeinstellungen
      await this.loadSystemSettings();

      // Check if the user have an auth token cookie.
      if (getCookie(EVENT_USER_AUTH_TOKEN)) {
        this.eventUserAuthorizedViaToken = true;
      }

      if (this.user?.id) {
        // Do not need to initialize, because we already have an active session.
        return;
      }

      try {
        // Check if we have a token, but no active user session.
        const token = localStorage.getItem(AUTH_TOKEN);
        if (token && !this.user?.id) {
          // Validate token expiration before creating a session
          try {
            const { payload } = decodeJsonWebToken(token);
            const currentTime = getCurrentUnixTimeStamp();
            if (payload?.exp > currentTime) {
              // Token is valid, create a user session
              await this.loginUser(token);
              return;
            } else {
              // Token is expired, try to refresh it
              try {
                const { token: newToken } = await refreshLogin();
                if (newToken) {
                  // Login with the new token and indicate it's a refresh
                  await this.loginUser(newToken, true);
                  return;
                }
              } catch (refreshError) {
                console.error("Failed to refresh token:", refreshError);
                // Clear invalid token
                localStorage.removeItem(AUTH_TOKEN);
              }
            }
          } catch (tokenError) {
            console.error("Invalid token format:", tokenError);
            // Clear invalid token
            localStorage.removeItem(AUTH_TOKEN);
          }
        }

        // Try to login the user by "event user auth token", if the related cookie is present.
        if (getCookie(EVENT_USER_AUTH_TOKEN)) {
          try {
            // Request a new token using the auth cookie
            const { token } = await loginByEventUserAuthToken();
            if (token) {
              // Login the user with the new token.
              await this.loginUser(token);
            }
          } catch (authTokenError) {
            console.error("Failed to login with event user auth token:", authTokenError);
          }
        }
      } catch (error) {
        console.error(error);
        handleError(error);
      } finally {
        // Mark initialization as complete regardless of success or failure
        this.isInitialized = true;
      }
    },

    /**
     * @param {String} token
     * @param {Boolean} isTokenRefresh - Indicates if this is from a token refresh operation
     * @returns {Promise<void>}
     */
    async loginUser(token, isTokenRefresh = false) {
      // Validate token.
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Token can not be empty!");
      }

      // Store token in local storage.
      localStorage.setItem(AUTH_TOKEN, token);
      
      // If this is a token refresh, update the timestamp
      if (isTokenRefresh) {
        this.lastTokenRefresh = new Date().toISOString();
      }

      // Decode jwt.
      try {
        const { payload } = decodeJsonWebToken(token);
        // Update user data.
        // todo: Add a validation of the response, so we can be sure to fetch real and good user data.
        const userData = {
          type: payload?.user?.type,
          id: payload?.user?.id,
          verified: payload?.user?.verified,
          role: payload?.role,
          expiresAt: payload?.exp,
        };

        this.user = userData;

        // Query organizer record, if this is an organizer session.
        if (this.user?.type === USER_TYPE_ORGANIZER) {
          try {
            await this.queryOrganizer();
          } catch (error) {
            console.error("Failed to fetch organizer data:", error);
            // Don't clear user session here, better to have partial data than none
          }
        }

        // Query event user record, if this is an event user session.
        if (this.user?.type === USER_TYPE_EVENT_USER) {
          try {
            await this.queryEventUser();
          } catch (error) {
            console.error("Failed to fetch event user data:", error);
            // Don't clear user session here, better to have partial data than none
          }
        }

        // Reset apollo client.
        return resetClient();
      } catch (error) {
        console.error(error);
        // Something went wrong, so terminate the user session.
        await logout();
      }
    },

    /**
     * @returns {Promise<void>}
     */
    async logoutUser() {
      // Clear localstorage to ensure a clean application state.
      // The server will remove the cookies.
      localStorage.clear();

      // Unset user data.
      this.user = {
        type: null,
        id: null,
        verified: null,
        role: null,
        expiresAt: null,
      };

      // Reset organizer and event user data.
      this.organizer.value = {};
      this.eventUser.value = {};
      this.resetEventStyles();
      // Reset apollo client.
      await terminateClient();
    },

    /**
     * @returns {Promise<Object>}
     */
    queryOrganizer() {
      return new Promise((resolve, reject) => {
        // Make sure we provide the Apollo client properly here
        provideApolloClient(apolloClient);

        try {
          // Use the direct Apollo client query to avoid Vue composition API issues
          apolloClient.query({
            query: ORGANIZER,
            variables: { organizerId: this.user?.id },
            fetchPolicy: "no-cache"
          })
            .then(result => {
              const organizer = result?.data?.organizer || null;
              if (organizer) {
                this.organizer.value = organizer;
                resolve(organizer);
                return;
              }
              reject(
                new EventUserNotFoundError(
                  `Organizer with id "${this.user?.id}" not found`,
                ),
              );
            })
            .catch(error => {
              console.error("Error fetching organizer data:", error);
              reject(error);
            });
        } catch (error) {
          console.error("Error in queryOrganizer:", error);
          reject(error);
        }
      });
    },
    /**
     * Updates the event styles and applies them
     * @param {Object} styles
     */
    updateEventStyles(styles) {
      // Ensure we're working with a clean object
      const cleanStyles = StyleManager.updateEventStyles(styles);
      this.eventStyles = cleanStyles;
    },

    /**
     * @returns {Promise<Object>}
     */
    queryEventUser() {
      return new Promise((resolve, reject) => {
        // Make sure we provide the Apollo client properly here
        provideApolloClient(apolloClient);

        try {
          // Use the direct Apollo client query to avoid Vue composition API issues
          apolloClient.query({
            query: EVENT_USER,
            variables: { id: this.user?.id },
            fetchPolicy: "no-cache"
          })
            .then(result => {
              const eventUser = result?.data?.eventUser || null;
              if (eventUser) {
                this.eventUser.value = eventUser;
                resolve(eventUser);
                return;
              }
              reject(
                new EventUserNotFoundError(
                  `Event user with id "${this.user?.id}" not found`,
                ),
              );
            })
            .catch(error => {
              console.error("Error fetching event user data:", error);
              reject(error);
            });
        } catch (error) {
          console.error("Error in queryEventUser:", error);
          reject(error);
        }
      });
    },

    /**
     * Resets event styles to default
     */
    resetEventStyles() {
      StyleManager.resetStyles(this.eventStyles);
      this.eventStyles = {};
    },
    /**
     * @param {Object} event
     * @returns void
     */
    setEvent(event) {
      this.event = event;
      if (event?.styles) {
        this.updateEventStyles(event.styles);
      }
    },

    /**
     * @param {boolean} verified
     * @param {number} voteAmount
     * @param {boolean} allowToVote
     * @returns void
     */
    updateEventUserAccessRights(verified, voteAmount, allowToVote) {
      if (!this.eventUser.value?.id) {
        return;
      }
      this.eventUser.value.verified = verified;
      this.eventUser.value.voteAmount = voteAmount;
      this.eventUser.value.allowToVote = allowToVote;
    },

    /**
     * @param {boolean} isOnline
     * @returns void
     */
    setEventUserOnlineState(isOnline) {
      if (!this.eventUser.value?.id) {
        return;
      }
      this.eventUser.value.online = isOnline;
    },

    /**
     * Lädt die globalen Systemeinstellungen vom Server
     */
    async loadSystemSettings() {
      try {
        const client = apolloClient;
        const result = await client.query({
          query: gql`
            query GetSystemSettings {
              systemSettings {
                id
                useDirectStaticPaths
                useDbFooterNavigation
                updatedAt
              }
            }
          `,
          fetchPolicy: 'network-only' // Immer vom Server laden
        });

        if (result.data?.systemSettings) {
          this.systemSettings = result.data.systemSettings;
        }
      } catch (error) {
        console.error('Failed to load system settings:', error);
      }
    },

    /**
     * Aktualisiert die globalen Systemeinstellungen (nur für Super-Admin)
     * @param {Object} settings Einstellungen zum Aktualisieren
     */
    async updateSystemSettings(settings) {
      try {
        // Nur erlauben, wenn Benutzer ein Super-Admin ist
        if (!this.isSuperOrganizer) {
          throw new Error('Super-Admin-Rechte erforderlich, um Systemeinstellungen zu ändern');
        }

        const client = apolloClient;
        const result = await client.mutate({
          mutation: gql`
            mutation UpdateSystemSettings($input: SystemSettingsInput!) {
              updateSystemSettings(input: $input) {
                id
                useDirectStaticPaths
                useDbFooterNavigation
                updatedAt
              }
            }
          `,
          variables: {
            input: settings
          }
        });

        if (result.data?.updateSystemSettings) {
          this.systemSettings = result.data.updateSystemSettings;
          return this.systemSettings;
        }
      } catch (error) {
        console.error('Failed to update system settings:', error);
        throw error;
      }
    },
  },
});
