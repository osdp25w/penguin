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
const SiteManagement = () => import('@/pages/SiteManagement.vue')  // 場域管理
const TelemetryDevices = () => import('@/pages/TelemetryDevices.vue') // 遙測設備管理
const MemberRentals  = () => import('@/pages/MyRentals.vue')         // 會員租借紀錄
const StaffRentals   = () => import('@/pages/RentalManagement.vue')  // 租借管理（staff/admin）

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
        path: 'my-rentals',
        name: 'member-rentals',
        component: MemberRentals,
        meta: { title: '我的租借', requiresAuth: true, allowedRoles: ['member', 'visitor', 'tourist'] }
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
      // Admin paths (canonical)
      {
        path: 'admin/users',
        name: 'admin-users',
        component: UserManagement,
        meta: { title: '帳號管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'admin/sites',
        name: 'admin-sites',
        component: SiteManagement,
        meta: { title: '場域管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'admin/telemetry',
        name: 'admin-telemetry',
        component: TelemetryDevices,
        meta: { title: '遙測設備', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'admin/rentals',
        name: 'admin-rentals',
        component: StaffRentals,
        meta: { title: '租借管理', requiresAuth: true, requiresAdmin: true }
      },
      // Legacy paths (redirect to admin/*)
      { path: 'users', redirect: '/admin/users' },
      { path: 'site-management', redirect: '/admin/sites' },
      { path: 'telemetry', redirect: '/admin/telemetry' }
    ]
  },

  /* ── 錯誤頁面 ── */
  {
    path: '/403',
    component: () => import('@/pages/Forbidden.vue')
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

  const requiresAuth = to.matched.some(route => route.meta?.requiresAuth)
  const requiresAdmin = to.matched.some(route => route.meta?.requiresAdmin)
  const allowedRolesMeta = to.matched.flatMap(route => (route.meta?.allowedRoles as string[] | undefined) ?? [])
  const memberOnly = to.matched.some(route => route.meta?.memberOnly)
  const currentRole = (auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role')) as string | null

  console.log('[Router] Navigation to:', to.path, 'Auth state:', {
    isLogin: auth.isLogin,
    user: auth.user,
    requiresAuth,
    requiresAdmin,
    allowedRolesMeta,
    memberOnly
  })

  /* 檢查登入狀態 */
  if (requiresAuth && !auth.isLogin) {
    console.log('[Router] Redirecting to login - not authenticated')
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  /* 會員（member）和遊客（tourist/visitor）的嚴格權限檢查 - 優先執行 */
  if (requiresAuth && (currentRole === 'member' || currentRole === 'visitor' || currentRole === 'tourist')) {
    // Member/Tourist 只能訪問這些頁面
    const allowedPaths = ['/sites', '/my-rentals']

    // 檢查是否訪問允許的路徑（精確匹配）
    const isAllowed = allowedPaths.includes(to.path)

    if (!isAllowed) {
      console.log('[Router] Member/Tourist user blocked from accessing', to.path, '- redirecting to /sites')
      return '/sites'
    }

    console.log('[Router] Member/Tourist access granted to', to.path)
    return // 直接返回，不執行後續檢查
  }

  /* 檢查管理員/工作人員權限（admin 或 staff） */
  if (requiresAdmin) {
    let role = auth.user?.roleId as string | null
    if (!role) role = (sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'))

    // 正常權限檢查：只允許 admin 或 staff 訪問
    const allowed = role === 'admin' || role === 'staff'

    console.log('[Router] Admin page access check:', {
      path: to.path,
      userRole: role,
      isAllowed: allowed,
      user: auth.user
    })

    if (!allowed) {
      console.warn('[Router] Access denied to admin page:', to.path, 'Role:', role, 'Redirecting to /403')
      return '/403'
    } else {
      console.log('[Router] Access granted to admin page:', to.path)
    }
  }

  /* 檢查特定角色權限 */
  if (allowedRolesMeta.length > 0) {
    if (!allowedRolesMeta.includes(currentRole || '')) {
      console.log('[Router] Access denied - role not in allowed list:', { role: currentRole, allowedRoles: allowedRolesMeta, path: to.path })
      return '/sites' // 預設重導向到場域地圖
    }
    console.log('[Router] Access granted by allowedRoles:', { role: currentRole, allowedRoles: allowedRolesMeta, path: to.path })
  }

  if (memberOnly) {
    if (currentRole !== 'member') {
      console.log('[Router] Non-member blocked from memberOnly route, redirecting to /sites')
      return '/sites'
    }
  }

  /* 設定頁面標題（如果還沒設定） */
  const titleFromMatched = to.matched.slice().reverse().find(route => route.meta?.title)?.meta?.title as string | undefined
  if (titleFromMatched) {
    document.title = `${titleFromMatched} - 嘉大數據平台`
  } else {
    document.title = '嘉大數據平台'
  }
})
