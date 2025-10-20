/**
 * @param {String} name
 * @param {String|Number} value
 * @param {Number} expireAfterDaysCount
 */
export function setCookie(name, value, expireAfterDaysCount = 1) {
  const date = new Date();
  date.setTime(date.getTime() + expireAfterDaysCount * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

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
