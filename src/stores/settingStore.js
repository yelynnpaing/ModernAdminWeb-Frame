import { defineStore } from 'pinia'
const key = 'access-setting-v1'
function load () {
  try {
    const saved = JSON.parse(localStorage.getItem(key)) || JSON.parse(localStorage.getItem('access-inventory-v1')) || {}
    return { locations: Array.isArray(saved.locations) ? saved.locations : [] }
  } catch {
    return { locations: [] }
  }
}
export const useSettingStore = defineStore('setting', {
  state: load,
  actions: {
    persist () {
      localStorage.setItem(key, JSON.stringify({ locations: this.locations }))
    },
    save (collection, record) {
      if (collection !== 'locations') {
        throw new Error('Unknown setting collection')
      }
      const name = String(record.name || '').trim()
      const description = String(record.description || '').trim()
      if (!name || name.length > 80 || description.length > 250) {
        throw new Error('Enter a name of 1–80 characters and a description of at most 250 characters.')
      }
      if (this[collection].some(item => item.id !== record.id && item.name.trim().toLowerCase() === name.toLowerCase())) {
        throw new Error('This name already exists.')
      }
      const index = this[collection].findIndex(item => item.id === record.id)
      if (record.id && index === -1) {
        throw new Error('Record not found')
      }
      const next = [...this[collection]]
      const copy = { id: record.id || Math.max(0, ...next.map(item => item.id)) + 1, name, description }
      if (index === -1) {
        next.push(copy)
      } else {
        next.splice(index, 1, copy)
      }
      localStorage.setItem(key, JSON.stringify({ locations: next }))
      this[collection] = next
    },
    remove (collection, id) {
      if (collection !== 'locations') {
        throw new Error('Unknown setting collection')
      }
      if (!this[collection].some(item => item.id === id)) {
        throw new Error('Record not found')
      }
      const next = this[collection].filter(item => item.id !== id)
      localStorage.setItem(key, JSON.stringify({ locations: next }))
      this[collection] = next
    },
  },
})
