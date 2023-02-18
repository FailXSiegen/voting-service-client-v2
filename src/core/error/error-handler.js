import {NetworkError} from "@/core/error/NetworkError";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {UnauthorizedError} from "@/core/error/UnauthorizedError";

/**
 * @param {Error|string} error
 * @param {Object} toastOptions @see https://vue3-toastify.netlify.app/api/toast.html
 */
export function handleError(error, toastOptions = {}) {
    // Log error to console in DEV environments.
    if (import.meta.env.DEV) {
        console.error(error);
    }
    let errorMessage = i18n.global.tc('error.network.genericError');
    if (error instanceof NetworkError) {
        errorMessage = error.message;
    } else if (error instanceof InvalidFormError) {
        errorMessage = error.message;
    } else if (error instanceof UnauthorizedError) {
        errorMessage = i18n.global.tc('error.network.unauthorized');
    } else if (error instanceof Error && import.meta.env.PROD) {
        errorMessage = i18n.global.tc('error.network.genericError');
    } else if (error instanceof Error && import.meta.env.DEV) {
        errorMessage = error.message;
    } else if (error instanceof String && import.meta.env.PROD) {
        errorMessage = error;
    } else if (error instanceof String && import.meta.env.DEV) {
        errorMessage = i18n.global.tc('error.network.genericError');
    }

    toast(errorMessage, {
        type: 'error',
        ...toastOptions
    });
}