import { localize } from '@/helper/localization-helper'

export async function login (email, password, loginType) {
  const endpoint = process.env.VUE_APP_API_HOST + '/login'
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ email, password, loginType }),
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
  if (response.status !== 201) {
    throw new Error(localize('view.login.invalidCredentials'))
  }
  const result = await response.json()
  if (!result.token) {
    throw new Error(localize('error.network.internalServerError'))
  }
  return result
}

export async function refreshLogin () {
  const endpoint = process.env.VUE_APP_API_HOST + '/login/refresh'
  const requestOptions = {
    method: 'POST',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    cache: 'no-cache',
    credentials: 'include',
    mode: 'cors'
  }
  const response = await fetch(endpoint, requestOptions)
  if (response.status >= 500) {
    throw new Error(localize('error.network.internalServerError'))
  }
  if (response.status !== 201) {
    throw new Error(localize('view.login.invalidCredentials'))
  }
  const result = await response.json()
  if (!result.token) {
    throw new Error(localize('error.network.internalServerError'))
  }
  return result
}
