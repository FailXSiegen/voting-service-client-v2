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

    // if (response.status >= 500) {
    //     throw new Error(localize('error.network.internalServerError'))
    // }
    // // @todo handle event user and organizer different!
    // if (response.status !== 201) {
    //     addDangerMessage('Fehler', 'Lokale Daten sind nicht mehr valide. Es wird ein Logout-Versuch unternommen.<br />Bei wiederauftretendem Fehler den lokalen Browser-Cache leeren')
    //     await onLogout(defaultClient)
    //     await router.push('/').catch(() => {})
    //     console.error(localize('view.login.invalidCredentials'))
    //     return
    // }
    // const result = await response.json()
    // if (!result.token) {
    //     addDangerMessage('Fehler', localize('error.network.internalServerError'))
    //     await onLogout(defaultClient)
    //     await router.push('/').catch(() => {})
    //     console.error(localize('error.network.internalServerError'))
    // }
    // return result
}
