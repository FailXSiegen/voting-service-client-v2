import {defineStore} from "pinia";
import {apolloClient, AUTH_TOKEN, resetClient, terminateClient} from "@/apollo-client";
import {decodeJsonWebToken} from "@/core/auth/jwt-util";
import {USER_TYPE_EVENT_USER, USER_TYPE_ORGANIZER} from "@/core/auth/login";
import {provideApolloClient, useQuery} from "@vue/apollo-composable";
import {QUERY_ORGANIZER} from "@/modules/organizer/graphql/queries/organizer";
import {reactive} from "vue";

// WATCH OUT: You can not use the router here. This will result in errors.

export const useCore = defineStore('core', {
    state: () => ({
        user: {
            type: null,
            id: null,
            role: null,
            verified: null,
            expiresAt: null
        },
        organizer: reactive({})
    }),
    getters: {
        isActiveOrganizerSession: (state) => state.user?.id > 0 && state.user?.type === USER_TYPE_ORGANIZER,
        isActiveEventUserSession: (state) => state.user?.id > 0 && state.user?.type === USER_TYPE_EVENT_USER,
        getActiveUserRole: (state) => state.user?.role,
        getActiveUserName: (state) => state.user,
        getOrganizer: (state) => state.organizer,
        isSuperOrganizer: (state) => state.organizer?.superAdmin === true,
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

            // Query organizer record, if this if an organizer session.
            if (this.user?.type === USER_TYPE_ORGANIZER) {
                this.queryOrganizer();
            }

            // Reset apollo client.
            return resetClient();
        },

        /**
         * @returns {Promise<void>}
         */
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
        },

        /**
         * @returns void
         */
        queryOrganizer() {
            provideApolloClient(apolloClient);
            const {onResult} = useQuery(QUERY_ORGANIZER, {organizerId: this.user?.id}, {fetchPolicy: "no-cache"});
            onResult((result) => {
                this.organizer = result?.data?.organizer;
            });
        },
    },
});