/* ─── Vue-Router 不再需要提前建立 Pinia ───────────────── */
/* ─── Vue-Router 相關 ────────────────────────────────── */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';
/* ─── Layout & Pages ────────────────────────────────── */
const AppShell = () => import('@/layouts/AppShell.vue');
const Login = () => import('@/pages/Login.vue');
/* 六大頁面 */
const Overview = () => import('@/pages/Overview.vue'); // 總覽
const SiteMap = () => import('@/pages/SiteMap.vue'); // 場域地圖  
const Vehicles = () => import('@/pages/Vehicles.vue'); // 車輛清單
const Alerts = () => import('@/pages/Alerts.vue'); // 警報中心
const MLPredict = () => import('@/pages/MLPredict.vue'); // ML 預測
const UserManagement = () => import('@/pages/UserManagement.vue'); // 帳號管理
const SiteManagement = () => import('@/pages/SiteManagement.vue'); // 場域管理
const TelemetryDevices = () => import('@/pages/TelemetryDevices.vue'); // 遙測設備管理
/* routes -------------------------------------------------- */
const routes = [
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
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
});
/* ─── 全域守衛 ──────────────────────────────────────── */
router.beforeEach((to) => {
    var _a, _b, _c;
    const auth = useAuth();
    console.log('[Router] Navigation to:', to.path, 'Auth state:', {
        isLogin: auth.isLogin,
        user: auth.user,
        requiresAuth: to.meta.requiresAuth,
        requiresAdmin: to.meta.requiresAdmin
    });
    /* 檢查登入狀態 */
    if (to.meta.requiresAuth && !auth.isLogin) {
        console.log('[Router] Redirecting to login - not authenticated');
        return { path: '/login', query: { redirect: to.fullPath } };
    }
    /* 檢查管理員/工作人員權限（admin 或 staff） */
    if (to.meta.requiresAdmin) {
        let role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
        if (!role)
            role = (sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'));
        // 正常權限檢查：只允許 admin 或 staff 訪問
        const allowed = role === 'admin' || role === 'staff';
        console.log('[Router] Admin page access check (DEBUG MODE - ALLOWING ALL):', {
            path: to.path,
            userRole: role,
            isAllowed: allowed,
            user: auth.user,
            sessionRole: sessionStorage.getItem('penguin.role'),
            localRole: localStorage.getItem('penguin.role'),
            userRoleFromAuth: (_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId
        });
        // TEMPORARY DEBUG: Allow all admin pages for testing
        if (!allowed) {
            console.warn('[Router] WOULD DENY access to admin page:', to.path, 'Role:', role, 'but ALLOWING for debug');
            // Temporarily allow access for debugging
            // return '/403'
        }
        else {
            console.log('[Router] Access granted to admin page:', to.path);
        }
    }
    /* 會員（member）僅能瀏覽「場域地圖」頁面 - 但不包括管理頁面（管理頁面已在上面處理） */
    if (to.meta.requiresAuth && !to.meta.requiresAdmin) {
        const role = (((_c = auth.user) === null || _c === void 0 ? void 0 : _c.roleId) || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'));
        if (role === 'member') {
            // 僅允許 /sites，其餘受保護頁面一律導向 /sites
            if (to.path !== '/sites') {
                console.log('[Router] WOULD REDIRECT member user from', to.path, 'to /sites, but ALLOWING for debug');
                // Temporarily allow for debugging
                // return '/sites'
            }
        }
    }
    /* 設定頁面標題 */
    if (to.meta.title) {
        document.title = `${to.meta.title} - 嘉大數據平台`;
    }
    else {
        document.title = '嘉大數據平台';
    }
});
