import { pageResult, queryOptions } from '../utilities/datatable.js'
import api from './api.js'
class RoleService {
  async GetAll (params, search = {}, options = {}) {
    return pageResult(await api.get('/role', { ...options, params: { ...queryOptions(params, ['id', 'name', 'description']), ...search } }))
  }

  async GetRoleList () {
    const response = await this.GetAll({ itemsPerPage: -1, sortBy: [{ key: 'name', order: 'asc' }] })
    return { data: response.data.data }
  }

  GetById (id, options = {}) {
    return api.get('/role/getbyid', { ...options, params: { id } })
  }

  SaveOrUpdate (model) {
    return api.post('/role/save', { id: model.id || 0, name: model.name.trim(), description: model.description?.trim() || null })
  }

  Delete (id) {
    return api.delete('/role/delete', { params: { id } })
  }
}
export default new RoleService()
