/**
 * Deep merges two objects together
 * @param {Object} target - The default object
 * @param {Object} source - The object to merge in (with higher priority)
 * @returns {Object} - The merged object
 */
export function deepMerge(target, source) {
  // Return source if target is not an object
  if (typeof target !== 'object' || target === null) {
    return source;
  }

  // Create a new object to avoid modifying the original
  const output = { ...target };

  // If source is not an object, return target
  if (typeof source !== 'object' || source === null) {
    return output;
  }

  // Iterate through source properties
  Object.keys(source).forEach(key => {
    if (source[key] === undefined) {
      return;
    }

    // Recursively merge objects
    if (
      typeof output[key] === 'object' && 
      output[key] !== null &&
      typeof source[key] === 'object' && 
      source[key] !== null
    ) {
      output[key] = deepMerge(output[key], source[key]);
    } else {
      // For primitives or when types don't match, simply override
      output[key] = source[key];
    }
  });

  return output;
}