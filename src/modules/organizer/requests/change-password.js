import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

/**
 * @param {String} password
 * @param {String} passwordRepeat
 * @param {String} hash
 * @returns {Promise<any>}
 */
export function changePassword(password, passwordRepeat, hash) {
  const endpoint = URLS.ORGANIZER_CHANGE_PASSWORD_ENDPOINT;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ password, passwordRepeat, hash }),
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
