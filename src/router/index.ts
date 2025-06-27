/* ─── Pinia 就緒 (守衛要用) ───────────────────────────── */
import { createPinia, setActivePinia } from 'pinia'
const pinia = createPinia()
setActivePinia(pinia)

/* ─── Vue-Router 相關 ────────────────────────────────── */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/stores/auth'

/* lazy pages */
const Login          = () => import('@/pages/Login.vue')
const Overview       = () => import('@/pages/Overview.vue')
const LiveMap        = () => import('@/pages/LiveMap.vue')
const VehicleTable   = () => import('@/pages/VehicleTable.vue')
const BatteryHealth  = () => import('@/pages/BatteryHealth.vue')
const Alerts         = () => import('@/pages/Alerts.vue')
const UserManagement = () => import('@/pages/UserManagement.vue')

/* ML 綜合單頁 */
const MLPredict      = () => import('@/pages/MLPredict.vue')

/* routes -------------------------------------------------- */
const routes: RouteRecordRaw[] = [
  /* ── 公開 ── */
  { path: '/login', component: Login },

  /* ── 需登入 ── */
  { path: '/',         component: Overview,      meta:{ requiresAuth:true } },
  { path: '/map',      component: LiveMap,       meta:{ requiresAuth:true } },
  { path: '/vehicles', component: VehicleTable,  meta:{ requiresAuth:true } },
  { path: '/battery',  component: BatteryHealth, meta:{ requiresAuth:true } },
  { path: '/alerts',   component: Alerts,        meta:{ requiresAuth:true } },

  /* ML 綜合預測 */
  { path: '/ml', component: MLPredict,  meta:{ requiresAuth:true, title:'ML 預測' } },

  /* Admin 專用 */
  { path: '/admin/users', component: UserManagement,
    meta:{ requiresAuth:true, requiresAdmin:true, title:'帳號管理' } },

  /* 403 */
  { path: '/403',
    component: { template:'<div class="grid h-screen place-content-center text-2xl font-bold text-rose-600">403&nbsp;Forbidden</div>' }
  },

  /* 其他 → / */
  { path: '/:pathMatch(.*)*', redirect:'/' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top:0 })
})

/* ─── 全域守衛 ──────────────────────────────────────── */
router.beforeEach(to => {
  const auth = useAuth()

  /* 尚未登入 */
  if (to.meta.requiresAuth && !auth.isLogin)
    return { path:'/login', query:{ redirect:to.fullPath } }

  /* 管理員驗證 */
  if (to.meta.requiresAdmin) {
    const role = auth.user?.roleId || sessionStorage.getItem('role')
    if (role !== 'admin') return '/403'
  }
})
