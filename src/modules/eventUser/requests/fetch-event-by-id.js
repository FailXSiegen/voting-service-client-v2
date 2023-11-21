import { standaloneRequest } from "@/core/request/standalone-request";
import { URLS } from "@/urls";

export function fetchEventById(id) {
  const endpoint = URLS.EVENT_FETCH_BY_ID + "/" + id;
  const requestOptions = {
    method: "GET",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    mode: "cors",
  };
  return standaloneRequest(endpoint, requestOptions).then(
    (result) => result.event,
  );
}
