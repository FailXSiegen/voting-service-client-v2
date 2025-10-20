import { NetworkError } from "@/core/error/NetworkError";
import t from "@/core/util/l18n";
import { URLS } from "@/urls";

export async function resolveShortlink(shortCode) {
  const endpoint = `${URLS.API_BASE_URL}/api/shortlink/${shortCode}`;
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
      if (response?.status >= 500) {
        throw new NetworkError(t("error.network.internalServerError"));
      }
      if (response?.status >= 400) {
        throw new NetworkError(t("error.network.consumerError"));
      }
      if (response?.status === 200) {
        return response.json();
      }
      throw new NetworkError(t("error.network.undefinedError"));
    })
    .then((json) => {
      if (!json.success) {
        throw new NetworkError(json.error || "Shortlink not found");
      }
      return json.data;
    });
}
