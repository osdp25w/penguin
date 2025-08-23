/* ─── Vue-Router 相關 ────────────────────────────────── */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';
/* Layout */
const AppShell = () => import('@/layouts/AppShell.vue');
/* Pages */
const Login = () => import('@/pages/Login.vue');
const Overview = () => import('@/pages/Overview.vue');
const SiteMap = () => import('@/pages/SiteMap.vue');
const Vehicles = () => import('@/pages/Vehicles.vue');
const Alerts = () => import('@/pages/Alerts.vue');
const MLPredict = () => import('@/pages/MLPredict.vue');
const Users = () => import('@/pages/admin/Users.vue');
/* routes -------------------------------------------------- */
const routes = [
    /* ── 公開頁面 ── */
    { path: '/login', component: Login },
    /* ── 主應用 (需登入) ── */
    {
        path: '/',
        component: AppShell,
        meta: { requiresAuth: true },
        children: [
            { path: '', component: Overview, meta: { title: '系統總覽' } },
            { path: 'sites', component: SiteMap, meta: { title: '場域地圖' } },
            { path: 'vehicles', component: Vehicles, meta: { title: '車輛清單' } },
            { path: 'alerts', component: Alerts, meta: { title: '警報中心' } },
            { path: 'ml', component: MLPredict, meta: { title: 'ML 預測' } },
            {
                path: 'admin/users',
                component: Users,
                meta: { title: '帳號管理', requiresAdmin: true }
            },
        ]
    },
    /* 403 Forbidden */
    {
        path: '/403',
        component: {
            template: '<div class="min-h-screen flex-center"><div class="text-center"><h1 class="text-4xl font-bold text-red-600 mb-4">403</h1><p class="text-gray-600">存取被拒絕</p></div></div>'
        }
    },
    /* 其他路由 → 首頁 */
    { path: '/:pathMatch(.*)*', redirect: '/' }
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
});
/* ─── 全域守衛 ──────────────────────────────────────── */
router.beforeEach(to => {
    var _a;
    const auth = useAuth();
    /* 尚未登入 */
    if (to.meta.requiresAuth && !auth.isLogin)
        return { path: '/login', query: { redirect: to.fullPath } };
    /* 管理員驗證 */
    if (to.meta.requiresAdmin) {
        const role = ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) || sessionStorage.getItem('role');
        if (role !== 'admin')
            return '/403';
    }
});
