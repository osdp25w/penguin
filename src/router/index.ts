/* ─── Vue-Router 不再需要提前建立 Pinia ───────────────── */

/* ─── Vue-Router 相關 ────────────────────────────────── */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/stores/auth'

/* ─── Layout & Pages ────────────────────────────────── */
const AppShell       = () => import('@/layouts/AppShell.vue')
const Login          = () => import('@/pages/Login.vue')

/* 六大頁面 */
const Overview       = () => import('@/pages/Overview.vue')         // 總覽
const SiteMap        = () => import('@/pages/SiteMap.vue')         // 場域地圖  
const Vehicles       = () => import('@/pages/Vehicles.vue')        // 車輛清單
const Alerts         = () => import('@/pages/Alerts.vue')          // 警報中心
const MLPredict      = () => import('@/pages/MLPredict.vue')       // ML 預測
const UserManagement = () => import('@/pages/UserManagement.vue')  // 帳號管理

/* routes -------------------------------------------------- */
const routes: RouteRecordRaw[] = [
  /* ── 公開頁面 ── */
  { path: '/login', component: Login, meta: { title: '登入' } },
  
  /* ── 主應用 (需登入，使用 AppShell Layout) ── */
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'overview',
        component: Overview,
        meta: { title: '總覽' }
      },
      {
        path: 'sites',
        name: 'sites',
        component: SiteMap,
        meta: { title: '場域地圖' }
      },
      {
        path: 'vehicles',
        name: 'vehicles', 
        component: Vehicles,
        meta: { title: '車輛清單' }
      },
      {
        path: 'alerts',
        name: 'alerts',
        component: Alerts,
        meta: { title: '警報中心' }
      },
      {
        path: 'ml',
        name: 'ml',
        component: MLPredict,
        meta: { title: 'ML 預測' }
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: UserManagement,
        meta: { title: '帳號管理', requiresAdmin: true }
      }
    ]
  },

  /* ── 錯誤頁面 ── */
  {
    path: '/403',
    component: { template: '<div class="grid h-screen place-content-center text-2xl font-bold text-rose-600">403 Forbidden</div>' }
  },

  /* ── 其他路徑重導到首頁 ── */
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top:0 })
})

/* ─── 全域守衛 ──────────────────────────────────────── */
router.beforeEach((to) => {
  const auth = useAuth()

  /* 檢查登入狀態 */
  if (to.meta.requiresAuth && !auth.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  /* 檢查管理員權限 */
  if (to.meta.requiresAdmin) {
    const role = auth.user?.roleId || sessionStorage.getItem('role')
    if (role !== 'admin') return '/403'
  }

  /* 設定頁面標題 */
  if (to.meta.title) {
    document.title = `${to.meta.title} - 嘉大數據平台`
  } else {
    document.title = '嘉大數據平台'
  }
})
