const removedNames = new Set(['INVENTORY', 'STOCK', 'STOCK MOVEMENTS', 'SUPPLIER', 'SUPPLIERS'])
const settingPaths = new Set(['/users', '/roles', '/role', '/locations', '/category-list', '/categories'])
export function settingMenu (backendMenu, hasSettingRead) {
  function prune (nodes) {
    return nodes.filter(item => !removedNames.has(item.title.toUpperCase()) && !/^\/(inventory|inventory-entry|stock-movements|stock|suppliers|supplier)(?:[/?#]|$)/.test(item.href || '') && !['/categories', '/category-list', '/settings/categories', '/settings/category'].includes(item.href)).map(item => ({ ...item, children: prune(item.children) }))
  }
  const items = prune(backendMenu)
  const setting = items.find(item => ['/settings', '/setting'].includes(item.href) || ['SETTING', 'SETTINGS'].includes(item.title.toUpperCase()))
  const children = setting ? [...setting.children] : []
  const rest = []
  for (const item of items) {
    if (item === setting) {
      continue
    }
    if (settingPaths.has(item.href) || item.href?.startsWith('/settings/')) {
      children.push(item)
    } else {
      rest.push(item)
    }
  }
  if (hasSettingRead) {
    children.push({ id: 'setting-category', title: 'Category', icon: 'mdi-shape-outline', href: '/category-list', readable: true, children: [] })
  }
  if (setting || children.length > 0) {
    rest.push({ ...(setting || { id: 'setting-group', title: 'Setting', icon: 'mdi-cog', href: null }), children })
  }
  return rest
}
