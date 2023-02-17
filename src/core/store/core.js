import {defineStore} from "pinia";
import {AUTH_TOKEN, resetClient} from "@/apollo-client";
import {decodeJsonWebToken} from "@/core/auth/jwt-util";
import {RouteOrganizerDashboard} from "@/router/routes";
import {router} from "@/router/router";

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
    actions: {
        /**
         * @param {string} token
         * @returns {Promise<NavigationFailure | void | undefined>}
         */
        async loginUser({token}) {
            // Validate token.
            if (typeof token !== 'string' || token.length === 0) {
                throw new Error("Token can not be empty!");
            }
            console.log('before', localStorage.getItem(AUTH_TOKEN));
            // Store token in local storage.
            if (typeof window.localStorage === 'undefined') {
                throw new Error("Missing LocalStorage object, but it is required.");
            }
            localStorage.setItem(AUTH_TOKEN, token);

            console.log('after', localStorage.getItem(AUTH_TOKEN));
            
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
            await resetClient();

            // Redirect user.
            // @todo Handle redirect depending on user type?
            // return router.push({name: RouteOrganizerDashboard});
        },
    },
});