import { createApp } from 'vue'
import App from '@/App.vue'
import { router } from '@/router'

/* 先載入 UnoCSS 生出的樣式包 ── 這一步很重要！ */
import 'virtual:uno.css'

/* 你的全域自訂 CSS（可有可無） */
import '@/assets/index.css'

createApp(App).use(router).mount('#app')
