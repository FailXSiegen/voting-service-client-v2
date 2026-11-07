import { URLS } from '@/urls';
import { standaloneRequest } from '@/core/request/standalone-request';
import { getFreshAccessToken } from '@/apollo-client';

/**
 * Zoom signature for the meeting of the current participant's event. The API determines event,
 * meeting and role itself and returns {signature, meetingNumber, password}.
 *
 * @returns {Promise<{signature: string, meetingNumber: string, password: string}>}
 */
export async function fetchSignature() {
  const endpoint = URLS.ZOOM_AUTH;
  const accessToken = await getFreshAccessToken();

  const requestOptions = {
    method: 'POST',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    cache: 'no-cache',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  };
  return standaloneRequest(endpoint, requestOptions);
}
