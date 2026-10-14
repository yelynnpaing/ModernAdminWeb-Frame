import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '../src/router/routes.js'
import { saveSession } from '../src/services/session.js'
import CategoryService from '../src/services/setting/category.service.js'
import { useSettingStore } from '../src/stores/settingStore.js'
import { settingMenu } from '../src/utilities/drawer.js'

const sessions = new Map()
globalThis.sessionStorage = { getItem: key => sessions.get(key) || null, setItem: (key, value) => sessions.set(key, value), removeItem: key => sessions.delete(key) }
let calls = []
let replies = []
function reply (data, status = 200) {
  replies.push({ data, status })
}
beforeEach(() => {
  sessions.clear()
  setActivePinia(createPinia())
  saveSession({ accessToken: 'test-token', userId: 1, expiresAtUtc: new Date(Date.now() + 60_000).toISOString() })
  globalThis.localStorage = { getItem: () => {
    throw new Error('Category must not read localStorage')
  }, setItem: () => {
    throw new Error('Category must not write localStorage')
  } }
  calls = []
  replies = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options, parsedBody: options.body ? JSON.parse(options.body) : null })
    const next = replies.shift()
    assert.ok(next, 'Unexpected API request: ' + url)
    return Response.json(next.data, { status: next.status })
  }
})

test('Category create, detail, update and delete call authenticated Lottery endpoints without localStorage', async () => {
  reply({ success: true })
  await CategoryService.SaveOrUpdate({ id: 0, name: ' Office ', description: ' Supplies ' })
  assert.deepEqual(calls[0].parsedBody, { id: 0, name: 'Office', description: 'Supplies' })
  reply({ id: 40, name: 'Office', description: 'Supplies' })
  assert.equal((await CategoryService.GetById(40)).data.id, 40)
  reply({ success: true })
  await CategoryService.SaveOrUpdate({ id: 40, name: 'Equipment', description: '' })
  assert.deepEqual(calls[2].parsedBody, { id: 40, name: 'Equipment', description: null })
  reply({ success: true })
  await CategoryService.Delete(40)
  assert.deepEqual(calls.map(call => [call.method, call.url]), [['POST', '/api/category/save'], ['GET', '/api/category/getbyid?id=40'], ['POST', '/api/category/save'], ['DELETE', '/api/category/delete?id=40']])
  assert.ok(calls.every(call => call.headers.Authorization === 'Bearer test-token'))
})

test('backend duplicate, missing-record and server failures do not fall back to local data', async () => {
  reply({ success: false, message: 'Category already exists.' }, 409)
  await assert.rejects(CategoryService.SaveOrUpdate({ name: 'Office' }), /already exists/)
  reply({ success: false, message: 'Category not found.' }, 404)
  await assert.rejects(CategoryService.GetById(99), /not found/)
  reply({ success: false, messages: ['Unable to load categories.'] }, 500)
  await assert.rejects(CategoryService.GetAll(), /Unable to load/)
})

test('Category server pagination maps total and passes filter/sort and cancellation signal', async () => {
  reply({ data: [{ id: 4, name: 'Office' }], total: 42, success: true })
  const controller = new AbortController()
  const page = await CategoryService.GetAll({ page: 2, itemsPerPage: 10, sortBy: [{ key: 'name', order: 'asc' }] }, { name: ' Office ' }, { signal: controller.signal })
  assert.equal(calls[0].url, '/api/category?start=2&length=10&sortBy=name&sortOrder=asc&name=Office')
  assert.equal(page.data.recordsTotal, 42)
  assert.equal(page.data.data[0].id, 4)
  assert.ok(calls[0].signal)
})

test('Setting store no longer loads or saves categories; Location persistence remains', () => {
  const storage = new Map([['access-setting-v1', JSON.stringify({ categories: [{ id: 1, name: 'Stale category' }], locations: [{ id: 2, name: 'Office' }] })]])
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }
  const store = useSettingStore()
  assert.equal(Object.hasOwn(store.$state, 'categories'), false)
  assert.equal(store.locations[0].name, 'Office')
  assert.throws(() => store.save('categories', { name: 'Local' }), /Unknown setting collection/)
  assert.throws(() => store.remove('categories', 1), /Unknown setting collection/)
  store.$state.categories = [{ id: 1, name: 'Old hot-reloaded state' }]
  store.save('locations', { id: 2, name: 'Updated office' })
  assert.equal(Object.hasOwn(JSON.parse(storage.get('access-setting-v1')), 'categories'), false)
})

test('HMS-style Setting group contains Category and permitted users, excluding removed modules', () => {
  const menu = settingMenu([
    { id: 1, title: 'Inventory', href: '/inventory', children: [] },
    { id: 2, title: 'Stock Movements', href: '/stock-movements', children: [] },
    { id: 3, title: 'Suppliers', href: '/suppliers', children: [] },
    { id: 8, title: 'Setting', href: '/settings', children: [] },
    { id: 12, title: 'Users', href: '/settings/users', children: [] },
  ], true)
  assert.equal(menu.length, 1)
  assert.deepEqual(menu[0].children.map(item => item.title), ['Users', 'Category'])
  const router = createRouter({ history: createMemoryHistory(), routes })
  assert.equal(router.resolve('/category-list').name, 'categoryList')
  assert.equal(router.resolve('/settings/categories').name, 'categoryList')
  for (const path of ['/inventory', '/stock-movements', '/suppliers']) {
    assert.ok(router.resolve(path).matched.every(record => record.path.includes(':pathMatch')))
  }
})
