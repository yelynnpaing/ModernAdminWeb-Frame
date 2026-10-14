const key = 'access-inventory-session-v1'
let generation = 0
export function readSession () {
  try {
    const data = JSON.parse(sessionStorage.getItem(key))
    return data?.accessToken && data?.userId && data?.expiresAtUtc ? data : null
  } catch {
    return null
  }
}
export function saveSession (session) {
  generation += 1
  sessionStorage.setItem(key, JSON.stringify({
    accessToken: session.accessToken, tokenType: 'Bearer', expiresAtUtc: session.expiresAtUtc,
    userId: session.userId, userName: session.userName, displayName: session.displayName,
  }))
}
export function clearSession () {
  generation += 1
  sessionStorage.removeItem(key)
}
export function sessionGeneration () {
  return generation
}
export function sessionExpired (session, now = Date.now()) {
  const expires = Date.parse(session?.expiresAtUtc)
  return !session?.accessToken || !Number.isFinite(expires) || expires <= now
}
