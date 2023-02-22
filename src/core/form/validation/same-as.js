import {helpers} from "@vuelidate/validators";

/**
 * @param {String} field
 * @param  {Object} formData
 * @returns {ValidationRuleWithParams}
 */
export const sameAs = (field, formData) => helpers.withParams({
        type: 'sameAs',
        value: field
    },
    (value) => value === formData[field]
);