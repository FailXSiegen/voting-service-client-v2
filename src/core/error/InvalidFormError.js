import i18n from "@/l18n";

export class InvalidFormError extends Error {
    constructor() {
        super(i18n.global.tc('error.formValidation.invalidForm'));
    }
}