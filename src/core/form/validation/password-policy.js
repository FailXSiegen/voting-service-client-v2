// SEC-38: same policy as the API (assertPasswordPolicy in voting-service-api/src/server/security.js).
export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_HINT = `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen.`;

/**
 * Vuelidate rule; use it under the key `passwordLength` (message: error.formValidation.passwordLength).
 * Empty values are left to `required`.
 *
 * @param {*} value
 * @returns {boolean}
 */
export const passwordLength = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'string' && value.length >= PASSWORD_MIN_LENGTH);
