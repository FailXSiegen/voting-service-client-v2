import {standaloneRequest} from "@/core/request/standalone-request";

/**
 * @param {Object} data The Organizer record to create.
 * @returns {Promise<any>}
 */
export function create(data) {
    const endpoint = import.meta.env.VITE_REQUEST_ORGANIZER_CREATE;
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return standaloneRequest(endpoint, requestOptions);
}
