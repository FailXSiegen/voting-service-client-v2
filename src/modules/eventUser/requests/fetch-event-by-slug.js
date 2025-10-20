import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

export function fetchEventBySlug(slug) {
  const endpoint = URLS.EVENT_VERIFY_SLUG;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ slug }),
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
    (result) => result.event,
  );
}
