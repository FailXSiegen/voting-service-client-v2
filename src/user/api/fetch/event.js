import { localize } from '@/frame/lib/localization-helper'

export async function fetchEventBySlug (slug) {
  const endpoint = process.env.VUE_APP_API_HOST + '/event/verify-slug'
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ slug }),
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
  return await response.json()
}
