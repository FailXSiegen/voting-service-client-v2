import t from "@/core/util/l18n";
import { NetworkError } from "@/core/error/NetworkError";
import { useCore } from "@/core/store/core";
import { handleError } from "@/core/error/error-handler";
import { ExpiredSessionError } from "@/core/error/ExpiredSessionError";
import { URLS } from "@/urls";
import { mapApiErrorToClientError } from "@/core/error/api-error-mapper";

export const LOGIN_TYPE_ORGANIZER = "organizer";
export const LOGIN_TYPE_EVENT_USER = "event-user";

export const USER_TYPE_ORGANIZER = "organizer";
export const USER_TYPE_EVENT_USER = "event-user";

export const USER_ROLE_ORGANIZER = "organizer";

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<any>}
 */
export function loginOrganizer(username, password) {
  return login(username, password, LOGIN_TYPE_ORGANIZER);
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} publicName
 * @param {number} eventId
 * @returns {Promise<any>}
 */
export function loginEventUser(username, password, publicName, eventId) {
  return login(username, password, LOGIN_TYPE_EVENT_USER, publicName, eventId);
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} loginType
 * @param {string} displayName
 * @param {number|null} eventId
 * @returns {Promise<any>}
 */
function login(
  username,
  password,
  loginType,
  displayName = "",
  eventId = null,
) {
  const endpoint = URLS.LOGIN_ENDPOINT;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      loginType,
      displayName,
      eventId,
    }),
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return fetch(endpoint, requestOptions)
    .then((response) => {
      if (response?.status >= 500) {
        throw new NetworkError(t("error.network.internalServerError"));
      }
      if (response?.status === 401 || response?.status === 403) {
        // Für Login-Fehler spezifische Behandlung
        throw new NetworkError(t("view.login.invalidCredentials"));
      }
      if (response?.status >= 400) {
        throw new NetworkError(t("error.network.consumerError"));
      }
      if (response?.status >= 200 && response?.status < 300) {
        return response;
      }
      throw new NetworkError(t("error.network.undefinedError"));
    })
    .then((response) => response.json())
    .then((response) => {
      if (response.token) {
        return response;
      }
      if (response.error) {
        throw mapApiErrorToClientError(response.error?.name || "");
      }
      throw new NetworkError(t("error.network.undefinedError"));
    })
    .then((data) => data);
}

/**
 * @returns {Promise<any>}
 */
export function refreshLogin() {
  const endpoint = URLS.REFRESH_LOGIN_ENDPOINT;
  const requestOptions = {
    method: "POST",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
  };

  return fetch(endpoint, requestOptions)
    .then((response) => {

      if (response?.status >= 500) {
        console.error("Refresh token server error:", response.status);
        throw new NetworkError(t("error.network.internalServerError"));
      }
      if (response?.status >= 400) {
        console.error("Refresh token client error:", response.status);
        throw new NetworkError(t("error.network.consumerError"));
      }
      if (
        response?.status >= 200 &&
        response?.status < 300 &&
        response?.status !== 201
      ) {
        console.error("Refresh token invalid refresh token error");
        throw new ExpiredSessionError(t("view.login.invalidRefreshToken"));
      }
      if (response?.status === 201) {
        return response;
      }
      console.error("Refresh token undefined error");
      throw new NetworkError(t("error.network.undefinedError"));
    })
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch(error => {
      console.error("Error during refreshLogin:", error);
      throw error;
    });
}

/**
 * @returns {Promise<any>}
 */
export function loginByEventUserAuthToken() {
  const endpoint = URLS.EVENT_USER_AUTH_TOKEN_LOGIN_ENDPOINT;
  const requestOptions = {
    method: "POST",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
  };

  return fetch(endpoint, requestOptions)
    .then((response) => {
      if (response?.status >= 500) {
        throw new NetworkError(t("error.network.internalServerError"));
      }
      if (response?.status >= 400) {
        throw new NetworkError(t("error.network.consumerError"));
      }
      if (
        response?.status >= 200 &&
        response?.status < 300 &&
        response?.status !== 201
      ) {
        throw new ExpiredSessionError(t("view.login.invalidRefreshToken"));
      }
      if (response?.status === 201) {
        return response;
      }
      throw new NetworkError(t("error.network.undefinedError"));
    })
    .then((response) => response.json())
    .then((data) => data);
}

/**
 * @returns {Promise<void>}
 */
export function logout() {
  const endpoint = URLS.LOGOUT_ENDPOINT;
  const requestOptions = {
    method: "GET",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
  };

  return fetch(endpoint, requestOptions)
    .then((response) => {
      return useCore().logoutUser();
    })
    .catch((error) => {
      console.error("Error during logout:", error);
      handleError(error);
    });
}
