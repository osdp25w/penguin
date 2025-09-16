/* ────────────────────────────────────────────────────────────────
 *  1. 啟用 MSW（開發模式或 VITE_ENABLE_MOCK="true" 時）
 * ---------------------------------------------------------------- */
async function startMockServiceWorker() {
    const shouldMock = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true';
    if (!shouldMock)
        return;
    try {
        // dynamic import 以免被 Tree-Shaking
        const { worker } = await import('@/mocks/browser');
        await worker.start({
            // ↓ 若產線要用，需先 `npx msw init public`
            // 使用 Vite 的 BASE_URL 以支援子目錄部署
            serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
            onUnhandledRequest: 'bypass'
        });
        console.info('%c[MSW] ✅ mock worker ready', 'color:#10b981');
    }
    catch (err) {
        console.error('[MSW] ❌ failed to start:', err);
    }
}
/* ────────────────────────────────────────────────────────────────
 *  2. 全域樣式 (Design Tokens → UnoCSS → 自訂覆蓋，順序不能反)
 * ---------------------------------------------------------------- */
import '@/design/tokens.css';
import 'virtual:uno.css';
import '@/assets/index.css';
/* ────────────────────────────────────────────────────────────────
 *  3. Vue App Bootstrap
 * ---------------------------------------------------------------- */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { router } from '@/router';
async function bootstrap() {
    await startMockServiceWorker(); // ← 若需 mock，確定 worker 已就緒
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.use(router);
    // 先啟動應用，再初始化進階功能
    app.mount('#app');
    // 非阻塞式初始化進階功能
    initAdvancedFeatures().catch(console.warn);
}
// 非阻塞式初始化進階功能
async function initAdvancedFeatures() {
    try {
        // HTTP 攔截器已移除，統一使用 api.ts 的 token 處理機制
        // 初始化 auth store 狀態
        const { useAuth } = await import('@/stores/auth');
        const auth = useAuth();
        // 初始化 token 狀態（檢查是否需要 refresh）
        try {
            await auth.initTokens();
        }
        catch (error) {
            console.warn('Failed to initialize tokens:', error);
        }
        // 如果有有效的 token，嘗試獲取用戶資訊
        if (auth.accessToken && auth.fetchMe) {
            try {
                await auth.fetchMe();
            }
            catch (error) {
                console.warn('Failed to fetch user info:', error);
            }
        }
        // 啟動自動 token 刷新服務
        const { startAutoRefresh, setupVisibilityChangeRefresh } = await import('@/lib/token-auto-refresh');
        startAutoRefresh(10, 15); // 每 10 分鐘檢查，剩餘 15 分鐘時刷新
        setupVisibilityChangeRefresh(5); // 頁面恢復時檢查 token
        console.log('[App] Advanced features initialized');
    }
    catch (error) {
        console.error('[App] Failed to initialize advanced features:', error);
    }
}
bootstrap();
