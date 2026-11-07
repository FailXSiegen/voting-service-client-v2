/**
 * Whitelists for third-party hosts whose scripts the client loads (Jitsi, mosparo).
 * Additional hosts come from comma-separated build-time env variables. Every host added there
 * must also be allowed in the Content-Security-Policy (docker/production/default.conf).
 */

export const DEFAULT_JITSI_HOSTS = ['meet.jit.si'];
export const DEFAULT_MOSPARO_HOSTS = ['captcha.failx.de'];

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?$/;

function parseList(value) {
  return String(value ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Normalizes "http(s)://host[:port][/]" or "host[:port]" to "host[:port]".
 * Returns null for anything else (paths, credentials, other schemes, whitespace).
 *
 * @param {String} value
 * @return {String|null}
 */
export function normalizeHost(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  return HOST_PATTERN.test(host) ? host : null;
}

export function allowedJitsiHosts() {
  return [...DEFAULT_JITSI_HOSTS, ...parseList(import.meta.env.VITE_JITSI_ALLOWED_HOSTS)];
}

export function allowedMosparoHosts() {
  return [...DEFAULT_MOSPARO_HOSTS, ...parseList(import.meta.env.VITE_MOSPARO_ALLOWED_HOSTS)];
}

/**
 * @param {String} value server URL or host as configured by an organizer/admin
 * @param {String[]} allowed
 * @return {String|null} the normalized host if it is whitelisted, otherwise null
 */
export function whitelistedHost(value, allowed) {
  const host = normalizeHost(value);
  return host && allowed.includes(host) ? host : null;
}
