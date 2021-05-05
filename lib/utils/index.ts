/**
 * @param str - The string to add a period to.
 * @return The string with a period at the end.
 */
export function period(str: string): string {
  if (!str || str.endsWith('.')) return str;
  return `${str}.`;
}

/**
 * @param str - The string to capitalize.
 * @return The string with the first letter capitalized.
 */
export function caps(str: string): string {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
