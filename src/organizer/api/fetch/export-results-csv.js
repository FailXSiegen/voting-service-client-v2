import { localize } from '@/frame/lib/localization-helper'

export async function exportPollResultsCsv (eventId, exportType) {
  const endpoint = process.env.VUE_APP_API_HOST + '/event/export-results'
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ eventId, exportType }),
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    cache: 'no-cache',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const response = await fetch(endpoint, requestOptions)
  if (response.status >= 500) {
    throw new Error(localize('error.network.internalServerError'))
  }
  if (response.status !== 200) {
    return null
  }
  return await response
}
