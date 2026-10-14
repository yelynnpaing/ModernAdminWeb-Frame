import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildProgramMenu, menuPath } from '../src/utilities/menu.js'
const programs = [{ id: 10, code: 'SYSTEM', name: 'System' }, { id: 11, code: 'USERS', name: 'User administration', parentId: 10 }, { id: 12, code: 'ROLES', name: 'Roles', parentId: 10 }]
const rows = [
  { id: 100, program_code_id: 10, role_id: 3, text: 'Backend System', parentId: 0, can_read: false },
  { id: 101, program_code_id: 11, role_id: 3, text: 'Backend Users', parentId: 10, href: '/users', icon: 'mdi-account', can_read: true },
  { id: 102, program_code_id: 12, role_id: 3, text: 'Backend Roles', parentId: 10, href: '/roles', can_read: false },
]
test('drawer uses backend titles, links, icons and program hierarchy with permitted children', () => {
  const menu = buildProgramMenu(rows, programs, 3)
  assert.equal(menu.length, 1)
  assert.equal(menu[0].title, 'Backend System')
  assert.equal(menu[0].href, null)
  assert.equal(menu[0].children.length, 1)
  assert.deepEqual(menu[0].children[0], { id: 11, parentId: 10, title: 'Backend Users', icon: 'mdi-account', href: '/users', readable: true, children: [] })
})
test('other roles and empty permissions cannot populate the drawer', () => {
  assert.deepEqual(buildProgramMenu(rows, programs, 4), [])
  assert.deepEqual(buildProgramMenu([], programs, 3), [])
  assert.deepEqual(buildProgramMenu(rows, programs, null), [])
})
test('new backend programs require no static frontend menu edits', () => {
  const menu = buildProgramMenu([...rows, { program_code_id: 50, role_id: 3, text: 'New backend page', href: '/new-page', can_read: true }], programs, 3)
  assert.equal(menu[1].title, 'New backend page')
  assert.equal(menu[1].href, '/new-page')
})
test('orphan parents and cyclic data terminate without duplicate nodes', () => {
  const menu = buildProgramMenu([
    { program_code_id: 1, role_id: 3, parentId: 2, can_read: true },
    { program_code_id: 2, role_id: 3, parentId: 1, can_read: true },
    { program_code_id: 3, role_id: 3, parentId: 99, can_read: true },
  ], [], 3)
  assert.equal(menu.length, 2)
  assert.doesNotThrow(() => JSON.stringify(menu))
})
test('drawer links reject external and authentication navigation', () => {
  assert.equal(menuPath('/users'), '/users')
  for (const href of ['https://example.com', '//example.com', String.raw`/\example.com`, '/login', '/logout', 'javascript:alert(1)', null]) {
    assert.equal(menuPath(href), null)
  }
})
