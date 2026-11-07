import { standaloneRequest } from '@/core/request/standalone-request';
import { URLS } from '@/urls';
import { eventRequestHeaders } from '@/modules/eventUser/requests/event-request-headers';

export function fetchEventById(id) {
  const endpoint = URLS.EVENT_FETCH_BY_ID + '/' + id;
  const requestOptions = {
    method: 'GET',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    cache: 'no-cache',
    credentials: 'include',
    mode: 'cors',
    headers: eventRequestHeaders(),
  };
  return standaloneRequest(endpoint, requestOptions).then((result) => result.event);
}
