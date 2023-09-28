import t from '@/core/util/l18n';

export class InvalidFormError extends Error {
    constructor() {
        super(t('error.formValidation.invalidForm'));
    }
}