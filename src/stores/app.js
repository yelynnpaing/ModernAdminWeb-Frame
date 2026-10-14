import { defineStore } from 'pinia'
import ProgramCodeService from '../services/programCodeService.js'
import { clearSession, readSession, saveSession, sessionExpired, sessionGeneration } from '../services/session.js'
import UserService from '../services/user.service.js'
import { buildProgramMenu } from '../utilities/menu.js'
import { checkPermission } from '../utilities/permissions.js'
let restoring = null
export const useAppStore = defineStore('app', {
  state: () => ({ loginUserInfo: null, permissionList: [], programCodeList: [], ready: false, loggingOut: false, loading: false }),
  getters: {
    isLoggedIn: state => !!state.loginUserInfo && !sessionExpired(readSession()),
    drawerItems: state => sessionExpired(readSession()) ? [] : buildProgramMenu(state.permissionList, state.programCodeList, state.loginUserInfo?.roleId),
  },
  actions: {
    CheckPermission (code, action) {
      return !sessionExpired(readSession()) && this.isLoggedIn && checkPermission(this.permissionList, this.programCodeList, this.loginUserInfo?.roleId, code, action)
    },
    async loadUserInfo () {
      const session = readSession()
      const version = sessionGeneration()
      if (sessionExpired(session)) {
        throw new Error('Session expired. Please log in again.')
      }
      const response = await UserService.GetById(session.userId)
      const user = response.data
      if (Number(user?.id) !== Number(session.userId) || !user.roleId || !user.status || (user.expiredDate && user.expiredDate < new Date().toISOString().slice(0, 10))) {
        throw new Error('This account is inactive or has no assigned role.')
      }
      const [permissions, programs] = await Promise.all([
        ProgramCodeService.GetPermissionListByRoleId(user.roleId), ProgramCodeService.GetProgramCodeList(),
      ])
      if (version !== sessionGeneration()) {
        throw new Error('The session changed. Please log in again.')
      }
      if (!Array.isArray(permissions.data) || !Array.isArray(programs.data)) {
        throw new TypeError('Unexpected permission response')
      }
      this.loginUserInfo = user
      this.permissionList = permissions.data
      this.programCodeList = programs.data
      this.ready = true
    },
    async Login (user) {
      this.setLogOutUserInfo()
      this.loading = true
      try {
        const response = await UserService.login(user)
        if (!response.data?.accessToken || !response.data?.userId || sessionExpired(response.data)) {
          throw new Error('The login API returned an invalid session.')
        }
        saveSession(response.data)
        await this.loadUserInfo()
      } catch (error) {
        this.setLogOutUserInfo()
        throw error
      } finally {
        this.loading = false
      }
    },
    async restoreSession () {
      if (this.ready) {
        return
      }
      if (restoring) {
        return restoring
      }
      if (sessionExpired(readSession())) {
        this.setLogOutUserInfo()
        return
      }
      this.loading = true
      const version = sessionGeneration()
      restoring = this.loadUserInfo().catch(error => {
        if (version === sessionGeneration()) {
          this.setLogOutUserInfo()
        }
        throw error
      }).finally(() => {
        restoring = null
        if (version === sessionGeneration() || !readSession()) {
          this.loading = false
        }
      })
      return restoring
    },
    async refreshPermissions () {
      if (!this.isLoggedIn) {
        return
      }
      const version = sessionGeneration()
      const response = await ProgramCodeService.GetPermissionListByRoleId(this.loginUserInfo.roleId)
      if (!Array.isArray(response.data)) {
        throw new TypeError('Unexpected permission response')
      }
      if (version === sessionGeneration()) {
        this.permissionList = response.data
      }
    },
    async Logout () {
      this.loggingOut = true
      try {
        if (!sessionExpired(readSession())) {
          await UserService.Logout()
        }
      } finally {
        this.setLogOutUserInfo()
        this.loggingOut = false
      }
    },
    setLogOutUserInfo () {
      clearSession()
      this.loginUserInfo = null
      this.permissionList = []
      this.programCodeList = []
      this.ready = true
    },
  },
})
