import { pageResult, queryOptions } from '../utilities/datatable.js'
import api from './api.js'
class UserService {
  login (user) {
    return api.post('/auth/login', { userName: user.username.trim(), password: user.password }, { authenticated: false })
  }

  Logout () {
    return api.post('/auth/logout')
  }

  async GetAll (params, search = {}, options = {}) {
    return pageResult(await api.get('/user', { ...options, params: { ...queryOptions(params, ['id', 'name', 'username', 'role']), ...search } }))
  }

  GetById (id, options = {}) {
    return api.get('/user/getbyid', { ...options, params: { id } })
  }

  SaveOrUpdate (model) {
    const body = { id: model.id || 0, name: model.name.trim(), userName: model.username.trim(), roleId: model.role_id, status: model.status, expiredDate: model.expired_date || null }
    if (!model.id) {
      body.password = model.password
    }
    return api.post('/user/save', body)
  }

  Delete (id) {
    return api.delete('/user/delete', { params: { id } })
  }

  ResetPassword (model) {
    return api.post('/user/reset_password', { oldPassword: model.old_password, newPassword: model.password })
  }
}
export default new UserService()
