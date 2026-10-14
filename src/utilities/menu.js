export function menuPath (value) {
  if (typeof value !== 'string') {
    return null
  }
  const href = value.trim()
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\') || /^\/(?:login|logout)(?:[/?#]|$)/i.test(href)) {
    return null
  }
  return href
}

export function buildProgramMenu (permissions, programs, roleId) {
  if (!roleId) {
    return []
  }
  const codes = new Map(programs.map(program => [Number(program.id), program]))
  const nodes = new Map()
  for (const permission of permissions) {
    if (Number(permission.role_id) !== Number(roleId)) {
      continue
    }
    const id = Number(permission.program_code_id)
    if (!Number.isInteger(id) || id <= 0 || nodes.has(id)) {
      continue
    }
    const program = codes.get(id)
    nodes.set(id, {
      id,
      parentId: Number(permission.parentId ?? program?.parentId) || 0,
      title: permission.text || program?.name || permission.programCodeName || program?.code || String(id),
      icon: permission.icon || program?.icon || 'mdi-circle-small',
      href: permission.can_read === true ? menuPath(permission.href ?? program?.url) : null,
      readable: permission.can_read === true,
      children: [],
    })
  }
  const visited = new Set()
  function branch (node) {
    if (visited.has(node.id)) {
      return null
    }
    visited.add(node.id)
    const children = [...nodes.values()].filter(child => child.parentId === node.id && child.id !== node.id).map(child => branch(child)).filter(Boolean)
    // Unreadable parents may group permitted descendants but cannot navigate.
    return node.readable || children.length > 0 ? { ...node, children } : null
  }
  const roots = [...nodes.values()].filter(node => !nodes.has(node.parentId) || node.parentId === node.id)
  const menu = roots.map(root => branch(root)).filter(Boolean)
  for (const node of nodes.values()) {
    if (!visited.has(node.id)) {
      const remaining = branch(node)
      if (remaining) {
        menu.push(remaining)
      }
    }
  }
  return menu
}
