import api from './api.js'
class ProgramCodeService {
  GetProgramCodeList () {
    return api.get('/permission/ProgramCodes')
  }

  GetPermissionListByRoleId (roleId) {
    return api.get('/permission/PermissionListByRoleId', { params: { roleId } })
  }

  SavePermission (rows) {
    return api.post('/permission/SavePermission', rows.map(row => ({
      id: row.id, program_code_id: row.program_code_id, role_id: row.role_id,
      can_read: row.can_read, can_write: row.can_write, can_delete: row.can_delete, can_print: row.can_print,
    })))
  }
}
export default new ProgramCodeService()
