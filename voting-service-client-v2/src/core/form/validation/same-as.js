import { helpers } from "@vuelidate/validators";

/**
 * @param {String} field
 * @param  {Object} formData
 * @returns {ValidationRuleWithParams}
 */
export const sameAs = (field, formData) =>
  helpers.withParams(
    {
      type: "sameAs",
      value: field,
    },
    (value) => value === formData[field],
  );

/**
 *
 * @param  {number} min
 * @returns {ValidationRuleWithParams}
 */
export const minLength = (min) => (value) => value.length >= min;

/**
 *
 * @param  {number} max
 * @returns {ValidationRuleWithParams}
 */
export const maxLength = (max) => (value) => value.length <= max;

/**
 * @param {String} field
 * @param  {Object} object
 * @param  {String|Number|Boolean} targetValue
 * @returns {ValidationRuleWithParams}
 */
export const objectPropertyIsEqual = (field, object, targetValue) =>
  helpers.withParams(
    {
      type: "objectPropertyIsEqual",
      value: field,
    },
    () => object[field] === targetValue,
  );

/**
 * @param {String} field
 * @param  {Object} object
 * @param  {String|Number|Boolean} targetValue
 * @returns {ValidationRuleWithParams}
 */
export const objectPropertyIsNotEqual = (field, object, targetValue) =>
  helpers.withParams(
    {
      type: "objectPropertyIsNotEqual",
      value: field,
    },
    () => object[field] !== targetValue,
  );

/**
 * @param {String} field
 * @param  {Object} object
 * @param  {Number} targetValue
 * @returns {ValidationRuleWithParams}
 */
export const objectPropertyIsGreaterThan = (field, object, targetValue) =>
  helpers.withParams(
    {
      type: "objectPropertyIsGreaterThan",
      value: field,
    },
    () => object[field] > targetValue,
  );
