import { AUTH_TOKEN } from '@/apollo-client';

/**
 * Headers for the public event endpoints (GET /event/:id, POST /event/verify-slug). The API only
 * includes the meeting access data for logged-in participants/organizers of the event, so the
 * access token is sent when present (the refresh cookie is accepted as fallback).
 *
 * @param {Object} headers
 * @returns {Object}
 */
export function eventRequestHeaders(headers = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN) : null;
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
