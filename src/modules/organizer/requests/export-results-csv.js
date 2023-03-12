import {NetworkError} from "@/core/error/NetworkError";
import i18n from "@/l18n";

export function exportPollResultsCsv(eventId, exportType) {
    const endpoint = import.meta.env.VITE_REQUEST_ORGANIZER_EXPORT_RESULTS;
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({eventId, exportType}),
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return fetch(endpoint, requestOptions).then((response) => {
        if (response?.status >= 500) {
            throw new NetworkError(i18n.global.tc('error.network.internalServerError'));
        }
        if (response?.status >= 400) {
            throw new NetworkError(i18n.global.tc('error.network.consumerError'));
        }
        if (response?.status === 200) {
            return response;
        }
        throw new NetworkError(i18n.global.tc('error.network.undefinedError'));
    });
}
