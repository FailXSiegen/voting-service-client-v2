import {standaloneRequest} from "@/core/request/standalone-request";

export function fetchEventBySlug(slug) {
    const endpoint = import.meta.env.VITE_REQUEST_EVENT_VERIFY_SLUG;
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({slug}),
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return standaloneRequest(endpoint, requestOptions).then((result) => result.event);
}
