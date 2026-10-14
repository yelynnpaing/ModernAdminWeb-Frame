const actions = { READ: 'can_read', WRITE: 'can_write', DELETE: 'can_delete', PRINT: 'can_print' }
const names = { SETTINGS: ['SETTING', 'SETTINGS'], USERS: ['USER', 'USERS'], ROLES: ['ROLE', 'ROLES'] }
function normalized (value) {
  return String(value || '').trim().toUpperCase()
}
export function checkPermission (permissions, programs, roleId, code, action) {
  if (!roleId || !actions[action]) {
    return false
  }
  const key = normalized(code)
  const aliases = names[key] || [key]
  // Prefer a canonical code. Display-name compatibility applies only when that code is absent.
  const program = programs.find(item => normalized(item.code) === key)
    || programs.find(item => aliases.includes(normalized(item.code)) || aliases.includes(normalized(item.name)))
  const row = permissions.find(item => Number(item.role_id) === Number(roleId) && (
    program ? Number(item.program_code_id) === Number(program.id) : aliases.includes(normalized(item.programCodeName))
  ))
  if (row?.can_read !== true) {
    return false
  }
  if (action === 'DELETE' && row.can_write !== true) {
    return false
  }
  return row[actions[action]] === true
}
export function normalizeActions (row) {
  if (!row.can_read) {
    row.can_write = false
    row.can_delete = false
    row.can_print = false
  }
  if (!row.can_write) {
    row.can_delete = false
  }
  return row
}
