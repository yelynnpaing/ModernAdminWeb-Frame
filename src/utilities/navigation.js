import { readSession, sessionExpired } from '../services/session.js'
export function safeRedirect (value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/^\/(?:login|logout)(?:[/?#]|$)/.test(value) ? value : null
}
export function landingRoute (appStore) {
  for (const [code, name] of [['DASHBOARD', 'home'], ['USERS', 'userList'], ['ROLES', 'roleList'], ['SETTINGS', 'settings']]) {
    if (appStore.CheckPermission(code, 'READ')) {
      return { name }
    }
  }
  return { name: 'accountEntry' }
}
export async function authorizeRoute (to, appStore) {
  if (to.name === 'logout' && !sessionExpired(readSession())) {
    return true
  }
  if (appStore.loginUserInfo && sessionExpired(readSession())) {
    appStore.setLogOutUserInfo()
  }
  if (!appStore.ready) {
    try {
      await appStore.restoreSession()
    } catch (error) {
      return { name: 'login', query: { redirect: to.fullPath, reason: error.status === 401 ? 'expired' : 'restore-failed' } }
    }
  }
  if (to.meta.public) {
    return appStore.isLoggedIn ? landingRoute(appStore) : true
  }
  if (!appStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.program && !appStore.CheckPermission(to.meta.program, to.meta.action || 'READ')) {
    return { name: 'forbidden' }
  }
  return true
}
