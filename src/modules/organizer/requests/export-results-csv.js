import { NetworkError } from "@/core/error/NetworkError";
import t from "@/core/util/l18n";
import { URLS } from "@/urls";

export function exportPollResultsCsv(eventId, exportType) {
  const endpoint = URLS.ORGANIZER_EXPORT_RESULTS;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ eventId, exportType }),
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return fetch(endpoint, requestOptions).then((response) => {
    if (response?.status >= 500) {
      throw new NetworkError(t("error.network.internalServerError"));
    }
    if (response?.status >= 400) {
      throw new NetworkError(t("error.network.consumerError"));
    }
    if (response?.status === 200) {
      return response;
    }
    throw new NetworkError(t("error.network.undefinedError"));
  });
}
