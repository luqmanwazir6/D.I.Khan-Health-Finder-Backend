/**
 * Safely escape characters that have special meaning in Regular Expressions.
 * Prevents ReDoS and regex syntax errors from user input.
 *
 * @param {string} string
 * @returns {string}
 */
export function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default escapeRegex;
