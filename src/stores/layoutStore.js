import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layoutStore', {
  state: () => ({
    drawer: true,
  }),

  actions: {
    toggleDrawer () {
      this.drawer = !this.drawer
    },
    closeDrawer () {
      this.drawer = false
    },
    openDrawer () {
      this.drawer = true
    },
  },
})
