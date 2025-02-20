import { defineStore } from "pinia";
import {
  apolloClient,
  AUTH_TOKEN,
  EVENT_USER_AUTH_TOKEN,
  resetClient,
  terminateClient,
} from "@/apollo-client";
import { decodeJsonWebToken } from "@/core/auth/jwt-util";
import {
  loginByEventUserAuthToken,
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
  }),
  getters: {
    isActiveOrganizerSession: (state) =>
      state.user?.id > 0 && state.user?.type === USER_TYPE_ORGANIZER,
    isActiveEventUserSession: (state) =>
      state.user?.id > 0 && state.user?.type === USER_TYPE_EVENT_USER,
    getActiveUserRole: (state) => state.user?.role,
    getActiveUserName: (state) => state.user,
    getOrganizer: (state) => state.organizer.value,
    getEventUser: (state) => state.eventUser.value,
    getEvent: (state) => state.event,
    isSuperOrganizer: (state) =>
      state.user?.type === USER_TYPE_ORGANIZER &&
      state.organizer.value?.superAdmin === true,
    isEventUserAuthorizedViaToken: (state) =>
      state.eventUserAuthorizedViaToken === true,
    getAuthToken: () => localStorage.getItem(AUTH_TOKEN),
    getCurrentEventStyles: (state) => state.eventStyles,
  },
  actions: {
    async init() {
      // Check if window.localStorage is available.
      if (typeof window.localStorage === "undefined") {
        throw new Error("Missing LocalStorage object, but it is required.");
      }

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
          // Create a user session
          await this.loginUser(token);
          return;
        }

        // Try to login the user by "event user auth token", if the related cookie is present.
        if (getCookie(EVENT_USER_AUTH_TOKEN)) {
          // The token is invalid, so we request a new one.
          const { token } = await loginByEventUserAuthToken();
          if (token) {
            // Login the user width the new token.
            await this.loginUser(token);
          }
        }
      } catch (error) {
        console.error(error);
        handleError(error);
      }
    },

    /**
     * @param {String} token
     * @returns {Promise<void>}
     */
    async loginUser(token) {
      // Validate token.
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Token can not be empty!");
      }

      // Store token in local storage.
      localStorage.setItem(AUTH_TOKEN, token);

      // Decode jwt.
      try {
        const { payload } = decodeJsonWebToken(token);
        // Update user data.
        // todo: Add a validation of the response, so we can be sure to fetch real and good user data.
        this.user = {
          type: payload?.user?.type,
          id: payload?.user?.id,
          verified: payload?.user?.verified,
          role: payload?.role,
          expiresAt: payload?.exp,
        };

        // Query organizer record, if this is an organizer session.
        if (this.user?.type === USER_TYPE_ORGANIZER) {
          await this.queryOrganizer();
        }

        // Query event user record, if this is an event user session.
        if (this.user?.type === USER_TYPE_EVENT_USER) {
          await this.queryEventUser();
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
        provideApolloClient(apolloClient);
        const organizerQuery = useQuery(
          ORGANIZER,
          { organizerId: this.user?.id },
          { fetchPolicy: "no-cache" },
        );
        organizerQuery.onResult((result) => {
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
        });
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
        provideApolloClient(apolloClient);
        const eventUserQuery = useQuery(
          EVENT_USER,
          { id: this.user?.id },
          { fetchPolicy: "no-cache" },
        );
        eventUserQuery.onResult((result) => {
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
        });
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
  },
});
