import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { registerPlugins } from '@/plugins'
import router from '@/router'
import { readSession, sessionExpired } from '@/services/session'
import { useAppStore } from '@/stores/app'
import { landingRoute } from '@/utilities/navigation'
import App from './App.vue'
import 'unfonts.css'
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
const appStore = useAppStore(pinia)
window.addEventListener('access-inventory:session-expired', () => {
  appStore.setLogOutUserInfo()
  if (router.currentRoute.value.name !== 'login' && router.currentRoute.value.name !== 'logout') {
    router.replace({ name: 'login', query: { reason: 'expired' } })
  }
})
window.addEventListener('access-inventory:permissions-changed', () => router.replace(landingRoute(appStore)))
// A Vue Router initial guard runs after Pinia is installed.
registerPlugins(app)
app.use(VueApexCharts)
setInterval(() => {
  if (appStore.loginUserInfo && sessionExpired(readSession())) {
    window.dispatchEvent(new CustomEvent('access-inventory:session-expired'))
  }
}, 1000)
window.addEventListener('focus', () => {
  if (appStore.loginUserInfo && sessionExpired(readSession())) {
    window.dispatchEvent(new CustomEvent('access-inventory:session-expired'))
  }
})
router.afterEach(to => {
  document.title = (to.meta.title ? to.meta.title + ' | ' : '') + 'Admin Web Frame'
})
router.isReady().then(() => app.mount('#app'))
