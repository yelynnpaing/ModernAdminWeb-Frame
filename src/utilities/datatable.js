// Lottery uses a one-based page number in start, not a record offset.
export function queryOptions ({ page = 1, itemsPerPage = 10, sortBy = [] } = {}, allowedSorts = ['id']) {
  const sort = sortBy[0] || { key: 'id', order: 'desc' }
  return {
    start: Math.max(1, Number(page) || 1),
    length: Number(itemsPerPage),
    sortBy: allowedSorts.includes(sort.key) ? sort.key : 'id',
    sortOrder: sort.order === 'asc' ? 'asc' : 'desc',
  }
}
export function pageResult (response) {
  const data = response?.data
  if (!Array.isArray(data?.data) || !Number.isFinite(data?.total)) {
    throw new TypeError('Unexpected API page response')
  }
  return { data: { data: data.data, recordsTotal: data.total } }
}
