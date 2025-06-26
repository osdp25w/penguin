/* ───────────────────────────────────────────────────────────────
 *  1.  啟用 MSW（DEV 或 VITE_ENABLE_MOCK=true 時）
 * ---------------------------------------------------------------- */
async function startMockServiceWorker(): Promise<void> {
  const shouldMock =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'

  if (!shouldMock) return

  try {
    const { worker } = await import('@/mocks/browser')       // dynamic import
    await worker.start({
      serviceWorker: { url: '/mockServiceWorker.js' },       // prod 需手動放 public
      onUnhandledRequest: 'bypass'
    })
    console.info('%c[MSW] ✅ mock worker ready', 'color:#10b981')
  } catch (err) {
    console.error('[MSW] ❌ failed to start:', err)
  }
}

/* ───────────────────────────────────────────────────────────────
 *  2.  全域樣式  (順序：UnoCSS -> 自訂覆蓋)
 * ---------------------------------------------------------------- */
import 'virtual:uno.css'
import '@/assets/index.css'

/* ───────────────────────────────────────────────────────────────
 *  3.  Vue App Bootstrap
 * ---------------------------------------------------------------- */
import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from '@/App.vue'
import { router }      from '@/router'

async function bootstrap() {
  await startMockServiceWorker()       // ← 先確定 mock (如需)

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

bootstrap()
