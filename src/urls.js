const env = import.meta.env;

export const URLS = {
  API_BASE_URL: env.VITE_API_BASE_URL,
  SUBSCRIPTION_URL: env.VITE_SUBSCRIPTION_URL,
  GRAPHQL_ENDPOINT: env.VITE_API_BASE_URL + env.VITE_GRAPHQL_ENDPOINT,
  LOGIN_ENDPOINT: env.VITE_API_BASE_URL + env.VITE_LOGIN_ENDPOINT,
  VALIDATE_PASSWORD_ENDPOINT:
    env.VITE_API_BASE_URL + env.VITE_VALIDATE_PASSWORD_ENDPOINT,
  REFRESH_LOGIN_ENDPOINT:
    env.VITE_API_BASE_URL + env.VITE_REFRESH_LOGIN_ENDPOINT,
  EVENT_USER_AUTH_TOKEN_LOGIN_ENDPOINT:
    env.VITE_API_BASE_URL + env.VITE_EVENT_USER_AUTH_TOKEN_LOGIN_ENDPOINT,
  LOGOUT_ENDPOINT: env.VITE_API_BASE_URL + env.VITE_LOGOUT_ENDPOINT,
  ORGANIZER_REQUEST_PASSWORD_CHANGE_ENDPOINT:
    env.VITE_API_BASE_URL +
    env.VITE_REQUEST_ORGANIZER_REQUEST_PASSWORD_CHANGE_ENDPOINT,
  ORGANIZER_CHANGE_PASSWORD_ENDPOINT:
    env.VITE_API_BASE_URL + env.VITE_REQUEST_ORGANIZER_CHANGE_PASSWORD_ENDPOINT,
  ORGANIZER_CREATE: env.VITE_API_BASE_URL + env.VITE_REQUEST_ORGANIZER_CREATE,
  ORGANIZER_VALIDATE_HASH_ENDPOINT:
    env.VITE_API_BASE_URL + env.VITE_REQUEST_ORGANIZER_VALIDATE_HASH_ENDPOINT,
  ORGANIZER_EXPORT_RESULTS:
    env.VITE_API_BASE_URL + env.VITE_REQUEST_ORGANIZER_EXPORT_RESULTS,
  EVENT_VERIFY_SLUG: env.VITE_API_BASE_URL + env.VITE_REQUEST_EVENT_VERIFY_SLUG,
  EVENT_FETCH_BY_ID: env.VITE_API_BASE_URL + env.VITE_REQUEST_EVENT_FETCH_BY_ID,
  ACTIVATE_EVENT_USER_AUTH_TOKEN:
    env.VITE_API_BASE_URL + env.VITE_REQUEST_ACTIVATE_EVENT_USER_AUTH_TOKEN,
};