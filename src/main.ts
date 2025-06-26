/* ──────────────────────────────  1.  啟用 MSW（僅 Dev） ───────────────────────────── */
function startMockServiceWorker(): Promise<void> {
  if (!import.meta.env.DEV) return Promise.resolve()           // ⬅️ build/prod 直接跳過

  return import('@/mocks/browser')                             // 動態載入才能被 tree-shaking
    .then(({ worker }) =>
      worker.start({ onUnhandledRequest: 'bypass' })           // 未攔到就交給真後端
    )
    .then(()  => console.info('%c[MSW] ✅ mock worker ready', 'color:#10b981'))
    .catch(err => console.error('[MSW] ❌ failed to start:', err))
}

/* ──────────────────────────────  2.  匯入全域樣式（順序很重要） ────────────────────── */
import 'virtual:uno.css'      // UnoCSS utilities —— **一定先載入**
import '@/assets/index.css'   // 你的自訂覆蓋樣式

/* ──────────────────────────────  3.  核心套件與 Vue 啟動 ────────────────────────── */
import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from '@/App.vue'
import { router }      from '@/router'

async function bootstrap() {
  await startMockServiceWorker()      // 先確保 MSW 完成，再進入 Vue

  const app = createApp(App)
  app.use(createPinia())              // 全域狀態管理
  app.use(router)                     // 路由
  app.mount('#app')                   // 掛載
}

bootstrap()
