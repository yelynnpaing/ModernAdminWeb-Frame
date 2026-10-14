import { clearSession, readSession, sessionExpired } from './session.js'
const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export class ApiError extends Error {
  constructor (message, status = 0, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}
export function responseMessage (data, fallback = 'Request failed') {
  const messages = data?.message || data?.messages || data?.title
  const validation = data?.errors && Object.values(data.errors).flat()
  const value = validation?.length ? validation : messages
  return Array.isArray(value) ? value.join(' ') : String(value || fallback)
}
function expireSession (token) {
  if (readSession()?.accessToken !== token) {
    return
  }
  clearSession()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('access-inventory:session-expired'))
  }
}
export async function request (endpoint, { method = 'GET', params = {}, body, signal, authenticated = true } = {}) {
  const session = readSession()
  if (authenticated && sessionExpired(session)) {
    expireSession(session?.accessToken)
    throw new ApiError('Session expired. Please log in again.', 401)
  }
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }
  const headers = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (authenticated) {
    headers.Authorization = 'Bearer ' + session.accessToken
  }
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 30_000)
  const combinedSignal = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal
  try {
    const response = await fetch(baseUrl + endpoint + (query.size > 0 ? '?' + query : ''), {
      method, headers, signal: combinedSignal, body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 401 && authenticated) {
      expireSession(session.accessToken)
    }
    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        throw new ApiError('The API returned an invalid response. Check the API URL and backend server.', response.status)
      }
    }
    if (!response.ok || data?.success === false) {
      throw new ApiError(responseMessage(data, 'Request failed (' + response.status + ')'), response.status, data)
    }
    return { data }
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    if (timeout.signal.aborted) {
      throw new ApiError('The request timed out. Please try again.')
    }
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Unable to connect to the API. Check that the Lottery backend is running.')
  } finally {
    clearTimeout(timer)
  }
}
export default {
  get: (url, options) => request(url, options),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
}
