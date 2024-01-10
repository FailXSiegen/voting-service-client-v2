import { URLS } from "@/urls";
import { standaloneRequest } from "@/core/request/standalone-request";
import { useCore } from "@/core/store/core";

/**
 * @param {string} meetingNumber
 * @returns {Promise<any>}
 */
export function fetchSignature(meetingNumber) {
  const endpoint = URLS.ZOOM_AUTH;
  const role = 0;
  const coreStore = useCore();

  const requestOptions = {
    method: "POST",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${coreStore.getAuthToken}`,
    },
    body: JSON.stringify({
      meetingNumber: meetingNumber,
      role: role,
    }),
  };
  return standaloneRequest(endpoint, requestOptions);
}
