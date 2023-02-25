import {standaloneRequest} from "@/core/request/standalone-request";

export function validatePassword({username, password}) {
    console.log({username, password});
    const endpoint = import.meta.env.VITE_VALIDATE_PASSWORD_ENDPOINT;
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({username, password}),
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
