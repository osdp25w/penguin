import { createRouter, createWebHistory } from 'vue-router';
/* === Lazy load pages === */
const Overview = () => import('@/pages/Overview.vue');
const LiveMap = () => import('@/pages/LiveMap.vue');
const VehicleTable = () => import('@/pages/VehicleTable.vue');
const BatteryHealth = () => import('@/pages/BatteryHealth.vue');
const Alerts = () => import('@/pages/Alerts.vue');
const routes = [
    { path: '/', name: 'overview', component: Overview },
    { path: '/map', name: 'live-map', component: LiveMap },
    { path: '/vehicles', name: 'vehicles', component: VehicleTable },
    { path: '/battery', name: 'battery-health', component: BatteryHealth },
    { path: '/alerts', name: 'alerts', component: Alerts },
    // 404：重新導回首頁
    { path: '/:pathMatch(.*)*', redirect: '/' }
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
});
