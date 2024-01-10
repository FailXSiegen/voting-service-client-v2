import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

export function activateEventUserAuthToken(token, username, publicName) {
  const endpoint = URLS.ACTIVATE_EVENT_USER_AUTH_TOKEN;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ token, username, publicName }),
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return standaloneRequest(endpoint, requestOptions).then(
    (result) => result?.success || false,
  );
}
