import {ApolloClient, split, InMemoryCache, HttpLink, ApolloLink} from "@apollo/client/core";
import {getMainDefinition} from "@apollo/client/utilities";
import {onError} from "@apollo/client/link/error";
import {logErrorMessages} from "@vue/apollo-util";
import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';
import {decodeJsonWebToken} from "@/core/auth/jwt-util";
import {getCurrentUnixTimeStamp} from "@/core/util/time-stamp";
import {refreshLogin} from "@/core/auth/login";
import {handleError} from "@/core/error/error-handler";
import {setContext} from "apollo-link-context";
import {useCore} from "@/core/store/core";
import {NetworkError} from "@/core/error/NetworkError";
import {UnauthorizedError} from "@/core/error/UnauthorizedError";
import {GraphQLError} from "@/core/error/GraphQLError";

export const AUTH_TOKEN = 'apollo-token';
export const REFRESH_TOKEN = 'refreshToken';

function getAccessToken() {
    if (typeof window.localStorage === 'undefined') {
        throw new Error("Missing LocalStorage object, but it is required.");
    }
    return localStorage.getItem(AUTH_TOKEN);
}

// function getHeaders() {
//     if (typeof window.localStorage === 'undefined') {
//         throw new Error("Missing LocalStorage object, but it is required.");
//     }
//     const headers = {};
//     headers["Content-Type"] = 'application/json';
//     const token = window.localStorage.getItem("apollo-token");
//     if (token) {
//         headers["Authorization"] = `Bearer ${token}`;
//     } else {
//         throw new Error("no token");
//     }
//     return headers;
// }

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
        // @todo why did we redirect in the old application?
        return;
    }

    // Compare access token expiry date time with the current date time.
    try {
        const {payload} = decodeJsonWebToken(accessToken);
        if (payload?.exp > getCurrentUnixTimeStamp()) {
            // The access token is still valid, so we just forward.
            return;
        }
    } catch (_) {
        // We do not have to catch the error here because if we have an error, the access token is invalid any ways.
    }

    // The token is invalid, so we request a new one.
    const {token} = await refreshLogin();

    // Login the user width the new token.
    const coreStore = useCore();
    await coreStore.loginUser(token);
});

// Create the http link.
const httpLink = new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    fetch: (uri, options) => {
        // options.headers = getHeaders();
        return fetch(uri, options);
    },
});

// Create the webSocket link.
const wsLink = new GraphQLWsLink(createClient({
    url: import.meta.env.VITE_SUBSCRIPTION_ENDPOINT,
    reconnect: true,
    lazy: true,
    timeout: 30000,
    inactivityTimeout: 30000,
    // connectionParams() {
    //     return {headers: getHeaders()};
    // }
}));

wsLink.client.on('connecting', () => {
    console.info('[Websocket] Connecting...');
});

wsLink.client.on('connected', () => {
    console.info('[Websocket] Is connected.');
});

wsLink.client.on('closed', () => {
    console.info('[Websocket] Is disconnected');
});

// Create the Error link.
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
        console.log(error);
        if (error.networkError?.statusCode === 401) {
            handleError(new UnauthorizedError());
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
            ({query}) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === "OperationDefinition" &&
                    definition.operation === "subscription"
                );
            },
            authLink.concat(refreshTokenLink.concat(wsLink)),
            authLink.concat(refreshTokenLink.concat(httpLink)),
        )
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
        await wsLink.client.terminate();
        await resetClient();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
    }
}
