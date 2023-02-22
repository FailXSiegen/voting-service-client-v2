import {standaloneRequest} from "@/core/request/standalone-request";

/**
 * @param {String} hash
 * @returns {Promise<any>}
 */
export function validateHash(hash) {
    const endpoint = import.meta.env.VITE_REQUEST_ORGANIZER_VALIDATE_HASH_ENDPOINT;
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({hash}),
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
