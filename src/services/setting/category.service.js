import { pageResult, queryOptions } from '../../utilities/datatable.js'
import api from '../api.js'

class CategoryService {
  async GetAll (params, search = {}, options = {}) {
    return pageResult(await api.get('/category', {
      ...options,
      params: { ...queryOptions(params, ['id', 'name', 'description']), name: search.name?.trim() || undefined },
    }))
  }

  GetById (id, options = {}) {
    return api.get('/category/getbyid', { ...options, params: { id } })
  }

  SaveOrUpdate (model) {
    return api.post('/category/save', {
      id: model.id || 0,
      name: model.name.trim(),
      description: model.description?.trim() || null,
    })
  }

  Delete (id) {
    return api.delete('/category/delete', { params: { id } })
  }
}

export default new CategoryService()
