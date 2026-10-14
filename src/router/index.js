import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { authorizeRoute } from '@/utilities/navigation'
import { routes } from './routes.js'

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes, scrollBehavior: () => ({ top: 0 }) })
router.beforeEach(to => authorizeRoute(to, useAppStore()))
export default router
