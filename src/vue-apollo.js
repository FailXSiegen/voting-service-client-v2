import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import { ApolloLink } from 'apollo-link'
import { getCurrentUnixTimeStamp } from '@/lib/time-stamp'
import { jwtDecode } from '@/lib/jwt-util'
import router from '@/router'
import { refreshLogin } from '@/graphql/auth'
import { apolloProvider } from '@/main'

// Install the vue plugin
Vue.use(VueApollo)

// Name of the localStorage item
export const AUTH_TOKEN = 'apollo-token'

// Http endpoint (use httpsEndpoint in production)
const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP

const link = ApolloLink.from([
  new TokenRefreshLink({
    isTokenValidOrUndefined: () => {
      const token = localStorage.getItem(AUTH_TOKEN)
      if (token === null) {
        router.push('/').catch(() => {})
      }
      const decodedToken = jwtDecode(token)
      return decodedToken.payload.exp > getCurrentUnixTimeStamp()
    },
    fetchAccessToken: () => {
      return refreshLogin()
    },
    handleFetch: async accessToken => {
      console.info('silent refresh!')
      localStorage.setItem(AUTH_TOKEN, accessToken)
      await apolloProvider.defaultClient.cache.reset()
    },
    handleResponse: (operation, accessTokenField) => async response => {
      return {
        access_token: response.token
      }
    },
    handleError: err => {
      console.error(err)
    }
  })
])

// Config
const defaultOptions = {
  httpEndpoint,
  wsEndpoint: process.env.VUE_APP_WS_ENDPOINT,
  tokenName: AUTH_TOKEN,
  persisting: false,
  websocketsOnly: false,
  ssr: false,
  link
}

export function createProvider (options = {}) {
  const { apolloClient, wsClient } = createApolloClient({
    ...defaultOptions,
    ...options
  })
  apolloClient.wsClient = wsClient

  return new VueApollo({
    defaultClient: apolloClient,
    defaultOptions: {
      $query: {
        // fetchPolicy: 'cache-and-network',
      }
    },
    errorHandler (error) {
      // eslint-disable-next-line no-console
      console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
    }
  })
}

export async function onLogin (apolloClient, token) {
  if (typeof localStorage !== 'undefined' && token) {
    localStorage.setItem(AUTH_TOKEN, token)
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    await apolloClient.resetStore()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('%cError on cache reset (login)', 'color: orange;', e.message)
  }
}

export async function onLogout (apolloClient) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN)
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    await apolloClient.resetStore()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
  }
}
