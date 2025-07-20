import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

/**
 * @param {String} username The username to request the password change for.
 * @returns {Promise<any>}
 */
export function requestPasswordChange(username) {
  const endpoint = URLS.ORGANIZER_REQUEST_PASSWORD_CHANGE_ENDPOINT;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ username }),
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return standaloneRequest(endpoint, requestOptions);
}
