import {NetworkError} from "@/core/error/NetworkError";
import i18n from "@/l18n";
import {ApiError} from "@/core/error/ApiError";

/**
 * @param {String} endpoint
 * @param {Object} requestOptions
 * @returns {Promise<any>}
 */
export function standaloneRequest(endpoint, requestOptions) {
    return fetch(endpoint, requestOptions)
        .then((response) => {
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
        })
        .then((response) => response.json())
        .then((data) => {
            if (!data?.success && data?.error?.name) {
                throw new ApiError(i18n.global.tc('error.api.' + data?.error?.name));
            }
            if (!data?.success) {
                throw new NetworkError(i18n.global.tc('error.network.consumerError'));
            }
            return data;
        });
}
