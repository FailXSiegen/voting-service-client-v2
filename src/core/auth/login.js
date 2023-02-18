import i18n from "@/l18n";
import {NetworkError} from "@/core/error/NetworkError";
import {useCore} from "@/core/store/core";
import {handleError} from "@/core/error/error-handler";

export const LOGIN_TYPE_ORGANIZER = 'organizer';
// const LOGIN_TYPE_EVENT_USER = '?';

export const USER_TYPE_ORGANIZER = 'organizer';
export const USER_TYPE_EVENT_USER = 'event-user';

export const USER_ROLE_ORGANIZER = 'organizer';

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

/**
 * @returns {Promise<any>}
 */
export function refreshLogin() {
    const endpoint = import.meta.env.VITE_REFRESH_LOGIN_ENDPOINT;
    const requestOptions = {
        method: 'POST',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors'
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
                throw new NetworkError(i18n.global.tc('view.login.invalidRefreshToken'));
            }
            if (response?.status === 201) {
                return response;
            }
            throw new NetworkError(i18n.global.tc('error.network.undefinedError'));
        })
        .then(response => response.json())
        .then(data => data);
}

/**
 * @returns {Promise<void>}
 */
export function logout() {
    const endpoint = import.meta.env.VITE_LOGOUT_ENDPOINT;
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors'
    };
    return fetch(endpoint, requestOptions)
        .then(() => {
            return useCore().logoutUser();
        })
        .catch((error) => {
            handleError(error);
        });
}