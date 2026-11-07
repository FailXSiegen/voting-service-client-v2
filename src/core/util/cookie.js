/**
 * @param {String} name
 * @return {String}
 */
export function getCookie(name) {
  const regex = new RegExp(`(^| )${name}=([^;]+)`);
  const match = document.cookie.match(regex);
  if (match) {
    return match[2];
  }
  return undefined;
}
