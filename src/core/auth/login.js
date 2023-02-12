import i18n from "@/l18n";
import {NetworkError} from "@/core/error/NetworkError";

const LOGIN_TYPE_ORGANIZER = 'organizer';

// const LOGIN_TYPE_EVENT_USER = '?';

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<any>}
 */
export function loginOrganizer(username, password) {
    return login(username, password, LOGIN_TYPE_ORGANIZER);
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} loginType
 * @param {string} displayName
 * @param {number|null} eventId
 * @returns {Promise<any>}
 */
function login(username, password, loginType, displayName = '', eventId = null) {
    const endpoint = import.meta.env.VITE_LOGIN_ENDPOINT;
    console.log(endpoint);
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({username, password, loginType, displayName, eventId}),
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return fetch(endpoint, requestOptions)
        .then((response) => {
            if (response?.status >= 500) {
                throw new NetworkError(i18n.global.tc('error.network.internalServerError'));
            }
            if (response?.status >= 400) {
                throw new NetworkError(i18n.global.tc('error.network.consumerError'));
            }
            if ((response?.status >= 200 && response?.status < 300) && response?.status !== 201) {
                throw new NetworkError(i18n.global.tc('view.login.invalidCredentials'));
            }
            if (response?.status === 201) {
                return response;
            }
            throw new NetworkError(i18n.global.tc('error.network.undefinedError'));
        })
        .then(response => response.json())
        .then(data => data);
}