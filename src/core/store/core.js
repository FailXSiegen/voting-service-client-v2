import {defineStore} from "pinia";
import {AUTH_TOKEN, resetClient, terminateClient} from "@/apollo-client";
import {decodeJsonWebToken} from "@/core/auth/jwt-util";
import {USER_TYPE_EVENT_USER, USER_TYPE_ORGANIZER} from "@/core/auth/login";
import {router} from "@/router/router";
import {RouteMainLogin} from "@/router/routes";

export const useCore = defineStore('core', {
    state: () => ({
        user: {
            type: null,
            id: null,
            role: null,
            verified: null,
            expiresAt: null
        },
    }),
    getters: {
        isActiveOrganiserSession: (state) => state.user?.id > 0 && state.user?.type === USER_TYPE_ORGANIZER,
        isActiveEventUserSession: (state) => state.user?.id > 0 && state.user?.type === USER_TYPE_EVENT_USER,
        getActiveUserRole: (state) => state.user?.role,
        getActiveUserName: (state) => state.user,
    },
    actions: {
        async init() {
            // Check if window.localStorage is available.
            if (typeof window.localStorage === 'undefined') {
                throw new Error("Missing LocalStorage object, but it is required.");
            }

            if (this.user?.id) {
                // Do not need to initialize, because we already have an active session.
                return;
            }

            // Check if we have a token, but no active user session.
            const token = localStorage.getItem(AUTH_TOKEN);
            if (token && !this.user?.id) {
                // Create a user session
                return this.loginUser(token);
            }
        },

        /**
         * @param {String} token
         * @returns {Promise<void>}
         */
        async loginUser(token) {
            // Validate token.
            if (typeof token !== 'string' || token.length === 0) {
                throw new Error("Token can not be empty!");
            }

            // Store token in local storage.
            localStorage.setItem(AUTH_TOKEN, token);

            // Decode jwt.
            const {payload} = decodeJsonWebToken(token);

            // Update user data.
            // @todo Add a validation of the response, so we can be sure to fetch real and good user data.
            // @todo Do we need the property `verified`?
            this.user = {
                type: payload?.user?.type,
                id: payload?.user?.id,
                verified: payload?.user?.verified,
                role: payload?.role,
                expiresAt: payload?.exp
            };

            // Reset apollo client.
            return resetClient();
        },
        async logoutUser() {
            // Store token in local storage.
            localStorage.removeItem(AUTH_TOKEN);

            // Unset user data.
            this.user = {
                type: null,
                id: null,
                verified: null,
                role: null,
                expiresAt: null
            };

            // Reset apollo client.
            await terminateClient();

            // Redirect to start page.
            await router.push({name: RouteMainLogin});
        },
    },
});