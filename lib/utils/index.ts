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

/**
 * Parses the given from header (from Gmail's API) into a name and email.
 * @param The from header from Gmail's API.
 * @return The from header parsed into name and email strings.
 */
const reFrom = /(.*) <(.*)>/;
export function parseFrom(from: string): { name: string; email: string } {
  const matches = from.match(reFrom);
  if (!matches) return { name: from, email: from };
  let name = matches[1].trim();
  if (name.startsWith('"')) {
    name = name.substr(1);
  }
  if (name.endsWith('"')) {
    name = name.substr(0, name.length - 1);
  }
  return { name: name, email: matches[2] };
}
