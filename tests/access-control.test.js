import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '../src/router/routes.js'
import { request } from '../src/services/api.js'
import PermissionService from '../src/services/programCodeService.js'
import RoleService from '../src/services/role.service.js'
import { clearSession, readSession, saveSession, sessionExpired } from '../src/services/session.js'
import UserService from '../src/services/user.service.js'
import { useAppStore } from '../src/stores/app.js'
import { pageResult, queryOptions } from '../src/utilities/datatable.js'
import { authorizeRoute, landingRoute, safeRedirect } from '../src/utilities/navigation.js'
import { checkPermission, normalizeActions } from '../src/utilities/permissions.js'

const storage = new Map()
globalThis.sessionStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
let calls = []
let replies = []
const session = () => ({ accessToken: 'test-token', userId: 9, userName: 'tester', displayName: 'Test User', expiresAtUtc: new Date(Date.now() + 60_000).toISOString() })
const user = { id: 9, name: 'Test User', userName: 'tester', roleId: 3, roleName: 'Administrator', status: true, expiredDate: '9999-12-31' }
const programs = [{ id: 20, code: 'USERS', name: 'Users' }, { id: 21, code: 'ROLES', name: 'Roles' }]
const permissions = [{ id: 1, role_id: 3, program_code_id: 20, can_read: true, can_write: true, can_delete: false, can_print: false }]
function reply (data, status = 200) {
  replies.push({ data, status })
}
beforeEach(() => {
  storage.clear()
  clearSession()
  setActivePinia(createPinia())
  calls = []
  replies = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options, parsedBody: options.body ? JSON.parse(options.body) : null })
    const next = replies.shift()
    assert.ok(next, 'Unexpected API request: ' + url)
    return Response.json(next.data, { status: next.status })
  }
})

test('login loads the Lottery user role and permissions before entering the application', async () => {
  reply(session())
  reply(user)
  reply(permissions)
  reply(programs)
  const app = useAppStore()
  await app.Login({ username: ' tester ', password: 'secret-password' })
  assert.equal(app.isLoggedIn, true)
  assert.equal(app.loginUserInfo.roleId, 3)
  assert.equal(app.CheckPermission('USERS', 'WRITE'), true)
  assert.equal(app.CheckPermission('USERS', 'DELETE'), false)
  assert.equal(app.CheckPermission('ROLES', 'READ'), false)
  assert.deepEqual(calls.map(call => call.url), ['/api/auth/login', '/api/user/getbyid?id=9', '/api/permission/PermissionListByRoleId?roleId=3', '/api/permission/ProgramCodes'])
  assert.deepEqual(calls[0].parsedBody, { userName: 'tester', password: 'secret-password' })
  assert.equal(calls[0].headers.Authorization, undefined)
  assert.equal(calls[1].headers.Authorization, 'Bearer test-token')
  assert.equal(JSON.stringify(readSession()).includes('password'), false)
  assert.deepEqual(landingRoute(app), { name: 'userList' })
})

test('reload refreshes identity and permissions; malformed session is ignored', async () => {
  saveSession(session())
  reply(user)
  reply(permissions)
  reply(programs)
  const app = useAppStore()
  await app.restoreSession()
  assert.equal(calls.length, 3)
  assert.equal(app.CheckPermission('USERS', 'READ'), true)
  storage.set('access-inventory-session-v1', '{broken')
  assert.equal(readSession(), null)
})

test('failed credentials and failed user lookup never leave an authenticated session', async () => {
  reply({ message: 'Invalid username or password.' }, 401)
  const app = useAppStore()
  await assert.rejects(app.Login({ username: 'tester', password: 'bad' }), /Invalid username/)
  assert.equal(readSession(), null)
  assert.equal(app.isLoggedIn, false)
  reply(session())
  reply({ message: 'No user' }, 404)
  await assert.rejects(app.Login({ username: 'tester', password: 'secret-password' }), /No user/)
  assert.equal(readSession(), null)
})

test('logout calls the backend and clears local state even when the server fails', async () => {
  saveSession(session())
  const app = useAppStore()
  app.loginUserInfo = user
  app.permissionList = permissions
  reply({ message: 'Server unavailable' }, 503)
  await assert.rejects(app.Logout(), /Server unavailable/)
  assert.equal(calls[0].url, '/api/auth/logout')
  assert.equal(calls[0].method, 'POST')
  assert.equal(readSession(), null)
  assert.equal(app.loginUserInfo, null)
  assert.deepEqual(app.permissionList, [])
})

test('protected 401 and expired tokens clear the session; 403 preserves it', async () => {
  saveSession(session())
  reply({ message: 'Forbidden' }, 403)
  await assert.rejects(request('/user'), error => error.status === 403)
  assert.ok(readSession())
  reply({ message: 'Unauthorized' }, 401)
  await assert.rejects(request('/user'), error => error.status === 401)
  assert.equal(readSession(), null)
  saveSession({ ...session(), expiresAtUtc: new Date(Date.now() - 1000).toISOString() })
  const count = calls.length
  await assert.rejects(request('/user'), /Session expired/)
  assert.equal(calls.length, count)
  assert.equal(readSession(), null)
  assert.equal(sessionExpired({ ...session(), expiresAtUtc: 'invalid' }), true)
})

test('an old request cannot invalidate a newer login session', async () => {
  saveSession(session())
  let complete
  globalThis.fetch = () => new Promise(resolve => {
    complete = resolve
  })
  const oldRequest = request('/user')
  saveSession({ ...session(), accessToken: 'new-token' })
  complete(Response.json({ message: 'Unauthorized' }, { status: 401 }))
  await assert.rejects(oldRequest)
  assert.equal(readSession().accessToken, 'new-token')
})

test('user saves use Lottery fields and omit passwords during edits', async () => {
  saveSession(session())
  const model = { id: 0, name: ' Test ', username: ' tester ', role_id: 3, status: false, expired_date: '', password: 'secret-password' }
  reply({ success: true })
  await UserService.SaveOrUpdate(model)
  assert.deepEqual(calls[0].parsedBody, { id: 0, name: 'Test', userName: 'tester', roleId: 3, status: false, expiredDate: null, password: 'secret-password' })
  reply({ success: true })
  await UserService.SaveOrUpdate({ ...model, id: 9 })
  assert.equal(Object.hasOwn(calls[1].parsedBody, 'password'), false)
  reply({ success: true })
  await UserService.ResetPassword({ old_password: 'old-password', password: 'new-password' })
  assert.equal(calls[2].url, '/api/user/reset_password')
  assert.deepEqual(calls[2].parsedBody, { oldPassword: 'old-password', newPassword: 'new-password' })
  assert.equal(calls[2].url.includes('old-password'), false)
})

test('pagination uses one-based start, backend total, boolean filters and sort allowlists', async () => {
  assert.deepEqual(queryOptions({ page: 3, itemsPerPage: 25, sortBy: [{ key: 'name', order: 'asc' }] }, ['name']), { start: 3, length: 25, sortBy: 'name', sortOrder: 'asc' })
  assert.equal(queryOptions({ sortBy: [{ key: 'invalid', order: 'desc' }] }).sortBy, 'id')
  assert.throws(() => pageResult({ data: {} }), /Unexpected API page/)
  saveSession(session())
  reply({ data: [user], total: 42, success: true })
  const response = await UserService.GetAll({ page: 2, itemsPerPage: 10 }, { status: false, role: null, name: '' })
  assert.equal(response.data.recordsTotal, 42)
  assert.equal(calls[0].url, '/api/user?start=2&length=10&sortBy=id&sortOrder=desc&status=false')
  reply({ data: [{ id: 3, name: 'Admin' }], total: 1, success: true })
  assert.equal((await RoleService.GetRoleList()).data[0].id, 3)
  assert.equal(calls[1].url, '/api/role?start=1&length=-1&sortBy=name&sortOrder=asc')
})

test('permissions use backend IDs, reject other roles and respect action dependencies', () => {
  assert.equal(checkPermission(permissions, programs, 3, 'USERS', 'READ'), true)
  assert.equal(checkPermission(permissions, programs, 4, 'USERS', 'READ'), false)
  assert.equal(checkPermission(permissions, programs, 3, 'ROLES', 'WRITE'), false)
  assert.equal(checkPermission([{ ...permissions[0], can_read: false, can_write: true }], programs, 3, 'USERS', 'WRITE'), false)
  assert.equal(checkPermission([{ ...permissions[0], can_write: false, can_delete: true }], programs, 3, 'USERS', 'DELETE'), false)
  assert.deepEqual(normalizeActions({ can_read: false, can_write: true, can_delete: true, can_print: true }), { can_read: false, can_write: false, can_delete: false, can_print: false })
})

test('matrix saves the Lottery snake_case payload', async () => {
  saveSession(session())
  reply({ success: true })
  await PermissionService.SavePermission([{ ...permissions[0], text: 'Users', role_name: 'Admin' }])
  assert.equal(calls[0].url, '/api/permission/SavePermission')
  assert.deepEqual(calls[0].parsedBody, permissions)
})

test('guards reject unauthenticated or unauthorized entry and unsafe redirects', async () => {
  const app = useAppStore()
  app.ready = true
  const route = { name: 'userList', fullPath: '/users', meta: { program: 'USERS' } }
  assert.deepEqual(await authorizeRoute(route, app), { name: 'login', query: { redirect: '/users' } })
  saveSession(session())
  app.loginUserInfo = user
  app.programCodeList = programs
  app.permissionList = []
  assert.deepEqual(await authorizeRoute(route, app), { name: 'forbidden' })
  app.permissionList = permissions
  assert.equal(await authorizeRoute(route, app), true)
  assert.deepEqual(await authorizeRoute({ ...route, meta: { program: 'ROLES', action: 'WRITE' } }, app), { name: 'forbidden' })
  assert.equal(safeRedirect('/users?page=2'), '/users?page=2')
  for (const value of ['https://example.com', '//example.com', String.raw`/\example.com`, '/login', '/logout?x=1']) {
    assert.equal(safeRedirect(value), null)
  }
  app.permissionList = []
  assert.deepEqual(landingRoute(app), { name: 'accountEntry' })
})

test('validation and malformed API responses show useful errors', async () => {
  saveSession(session())
  reply({ errors: { Password: ['Password too short'] } }, 400)
  await assert.rejects(request('/user/save', { method: 'POST', body: {} }), /Password too short/)
  globalThis.fetch = async () => new Response('<html>proxy error</html>', { status: 502 })
  await assert.rejects(request('/role'), /invalid response/)
})

test('a malformed protected 401 still clears the session', async () => {
  saveSession(session())
  globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
  await assert.rejects(request('/user'))
  assert.equal(readSession(), null)
})

test('direct logout after reload does not require permission bootstrap', async () => {
  saveSession(session())
  const app = useAppStore()
  const result = await authorizeRoute({ name: 'logout', fullPath: '/logout', meta: { bare: true } }, app)
  assert.equal(result, true)
  assert.equal(calls.length, 0)
  reply({ success: true })
  await app.Logout()
  assert.equal(calls[0].url, '/api/auth/logout')
  assert.equal(readSession(), null)
})

test('an expired account is rejected even when its token has not expired', async () => {
  reply(session())
  reply({ ...user, expiredDate: '2000-01-01' })
  const app = useAppStore()
  await assert.rejects(app.Login({ username: 'tester', password: 'secret-password' }), /inactive/)
  assert.equal(readSession(), null)
})

test('login drawer comes from role API metadata and updates after permission refresh and logout', async () => {
  reply(session())
  reply(user)
  reply([{ ...permissions[0], text: 'Users from API', href: '/users', icon: 'mdi-account-group', parentId: 0 }])
  reply(programs)
  const app = useAppStore()
  await app.Login({ username: 'tester', password: 'secret-password' })
  assert.equal(app.drawerItems[0].title, 'Users from API')
  assert.equal(app.drawerItems[0].href, '/users')
  assert.equal(app.drawerItems[0].icon, 'mdi-account-group')
  reply([])
  await app.refreshPermissions()
  assert.deepEqual(app.drawerItems, [])
  reply({ success: true })
  await app.Logout()
  assert.deepEqual(app.drawerItems, [])
})

test('user-info identity must match the login session user ID', async () => {
  reply(session())
  reply({ ...user, id: 99 })
  const app = useAppStore()
  await assert.rejects(app.Login({ username: 'tester', password: 'secret-password' }))
  assert.equal(readSession(), null)
  assert.deepEqual(app.drawerItems, [])
})

test('Role CRUD uses the Lottery detail/save/delete endpoints and trimmed fields', async () => {
  saveSession(session())
  reply({ id: 5, name: 'Storekeeper', description: 'Manage stock' })
  const detail = await RoleService.GetById(5)
  assert.equal(detail.data.name, 'Storekeeper')
  reply({ success: true })
  await RoleService.SaveOrUpdate({ name: ' Storekeeper ', description: ' Manage stock ' })
  assert.deepEqual(calls[1].parsedBody, { id: 0, name: 'Storekeeper', description: 'Manage stock' })
  reply({ success: true })
  await RoleService.SaveOrUpdate({ id: 5, name: ' Storekeeper ', description: '' })
  assert.deepEqual(calls[2].parsedBody, { id: 5, name: 'Storekeeper', description: null })
  reply({ success: true })
  await RoleService.Delete(5)
  assert.equal(calls[0].url, '/api/role/getbyid?id=5')
  assert.equal(calls[3].url, '/api/role/delete?id=5')
  assert.equal(calls[3].method, 'DELETE')
})

test('User delete and referenced-role delete failures remain visible as API errors', async () => {
  saveSession(session())
  reply({ success: true })
  await UserService.Delete(12)
  assert.equal(calls[0].url, '/api/user/delete?id=12')
  assert.equal(calls[0].method, 'DELETE')
  reply({ success: false, message: 'Role is assigned to users.' }, 409)
  await assert.rejects(RoleService.Delete(5), /Role is assigned/)
  assert.ok(readSession())
})

test('actual backend /settings/users and /settings routes allow the supplied admin permissions', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const app = useAppStore()
  saveSession(session())
  app.ready = true
  app.loginUserInfo = { ...user, roleId: 1 }
  app.programCodeList = [{ id: 8, code: 'SETTING', name: 'Setting' }, { id: 12, code: 'SET_USER', name: 'Users' }]
  app.permissionList = [
    { id: 1, program_code_id: 8, programCodeName: 'Setting', role_id: 1, can_read: true, can_write: true, can_delete: true, can_print: true, href: '/settings', parentId: 0 },
    { id: 2, program_code_id: 12, programCodeName: 'Users', role_id: 1, can_read: true, can_write: true, can_delete: true, can_print: true, href: '/settings/users', parentId: 0 },
  ]
  const usersRoute = router.resolve('/settings/users')
  assert.equal(usersRoute.name, 'userList')
  assert.equal(await authorizeRoute(usersRoute, app), true)
  assert.equal(app.CheckPermission('USERS', 'WRITE'), true)
  assert.equal(app.CheckPermission('USERS', 'DELETE'), true)
  assert.equal(await authorizeRoute(router.resolve('/settings'), app), true)
  app.permissionList[1].can_read = false
  assert.deepEqual(await authorizeRoute(usersRoute, app), { name: 'forbidden' })
  app.loginUserInfo.roleId = 2
  assert.equal(app.CheckPermission('SETTINGS', 'READ'), false)
})

test('canonical program IDs take precedence over similarly named display labels', () => {
  const options = [{ id: 12, code: 'USERS', name: 'Users' }, { id: 99, code: 'OTHER', name: 'Users' }]
  const rows = [{ program_code_id: 99, programCodeName: 'Users', role_id: 1, can_read: true, can_write: true }]
  assert.equal(checkPermission(rows, options, 1, 'USERS', 'READ'), false)
})
