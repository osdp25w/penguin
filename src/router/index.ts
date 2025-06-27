/* ──────────────────────────  Pinia 就緒（守衛要用） ───────────── */
import { createPinia, setActivePinia } from 'pinia'
const pinia = createPinia()
setActivePinia(pinia)

/* ──────────────────────────  Vue Router 相關 ────────────────── */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/stores/auth'

/* === Lazy-load pages === */
const Login         = () => import('@/pages/Login.vue')
const Overview      = () => import('@/pages/Overview.vue')
const LiveMap       = () => import('@/pages/LiveMap.vue')
const VehicleTable  = () => import('@/pages/VehicleTable.vue')
const BatteryHealth = () => import('@/pages/BatteryHealth.vue')
const Alerts        = () => import('@/pages/Alerts.vue')

const routes: RouteRecordRaw[] = [
  { path: '/login',   name: 'login',           component: Login },

  { path: '/',        name: 'overview',        component: Overview,      meta: { requiresAuth: true } },
  { path: '/map',     name: 'live-map',        component: LiveMap,       meta: { requiresAuth: true } },
  { path: '/vehicles',name: 'vehicles',        component: VehicleTable,  meta: { requiresAuth: true } },
  { path: '/battery', name: 'battery-health',  component: BatteryHealth, meta: { requiresAuth: true } },
  { path: '/alerts',  name: 'alerts',          component: Alerts,        meta: { requiresAuth: true } },

  /* 404 → 回首頁 */
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

/* ─────────────── 全域守衛：未登入先去 /login ─────────────── */
router.beforeEach((to) => {
  const auth = useAuth()
  if (to.meta.requiresAuth && !auth.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
