import {NetworkError} from "@/core/error/NetworkError";
import {toast} from "vue3-toastify";
import t from '@/core/util/l18n';
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {UnauthorizedError} from "@/core/error/UnauthorizedError";
import {ApiError} from "@/core/error/ApiError";
import {GraphQLError} from "@/core/error/GraphQLError";

/**
 * @param {Error|string} error
 * @param {Object} toastOptions @see https://vue3-toastify.netlify.app/api/toast.html
 */
export function handleError(error, toastOptions = {}) {
    // Log error to console in DEV environments.
    if (import.meta.env.DEV) {
        console.error(error);
    }
    let errorMessage = t('error.network.genericError');
    if (error instanceof NetworkError) {
        errorMessage = error.message;
    } else if (error instanceof ApiError) {
        errorMessage = error.message;
    } else if (error instanceof GraphQLError) {
        // Only show graphQl errors in DEV.
        if (import.meta.env.DEV) {
            errorMessage = error.message;
        } else {
            errorMessage = t('error.network.genericError');
        }
    } else if (error instanceof InvalidFormError) {
        errorMessage = error.message;
    } else if (error instanceof UnauthorizedError) {
        errorMessage = t('error.network.unauthorized');
    } else if (error instanceof Error && import.meta.env.PROD) {
        errorMessage = t('error.network.genericError');
    } else if (error instanceof Error && import.meta.env.DEV) {
        errorMessage = error.message;
    } else if (error instanceof String && import.meta.env.PROD) {
        errorMessage = error;
    } else if (error instanceof String && import.meta.env.DEV) {
        errorMessage = t('error.network.genericError');
    }

    toast(errorMessage, {
        type: 'error',
        ...toastOptions
    });
}