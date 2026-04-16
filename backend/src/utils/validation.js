/**
 * validation.js
 *
 * Shared validation helpers for request parameters.
 * Isolated here so they can be reused across routes or transplanted into another project.
 */

/**
 * Returns true if the value matches a valid EPA registration number format.
 * EPA reg numbers look like "12345-678" or "12345-678-9".
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidRegNo(value) {
  return /^\d+-\d+(-\d+)?$/.test(value);
}
