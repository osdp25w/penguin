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
            serviceWorker: { url: '/mockServiceWorker.js' },
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
    app.use(createPinia());
    app.use(router);
    app.mount('#app');
}
bootstrap();
