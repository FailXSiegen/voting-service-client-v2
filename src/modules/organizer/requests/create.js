import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

/**
 * @param {Object} data The Organizer record to create.
 * @returns {Promise<any>}
 */
export function create(data) {
  const endpoint = URLS.ORGANIZER_CREATE;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(data),
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
