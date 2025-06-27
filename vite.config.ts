import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* --- 在 ESM 取代 __dirname --- */
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS()               // ← 新增 UnoCSS，預設 preset-uno 即支援 Tailwind 語法
  ],

  /* 路徑別名 */
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },

  /* 若有 SCSS 變數／mixin 可在這裡全域注入 */
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/_variables.scss" as *;`
      }
    }
  },

  /* 本機開發伺服器（與 Docker Nginx 無衝突） */
  server: {
    host: '0.0.0.0',
    port: 5173
  },

  /* 建置輸出 */
  build: {
    outDir: 'dist',
    sourcemap: false
  },

  /* 只注入 VITE_ 開頭的環境變數 */
  envPrefix: 'VITE_'
})
