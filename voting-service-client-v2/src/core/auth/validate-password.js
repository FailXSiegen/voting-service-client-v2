import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

export function validatePassword({ username, password }) {
  const endpoint = URLS.VALIDATE_PASSWORD_ENDPOINT;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ username, password }),
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
