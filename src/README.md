# src/

前端應用程式原始碼。核心採用 Vue 3 + TypeScript + Pinia，搭配 UnoCSS 與自建 Design System。

## 目錄
| 資料夾 | 說明 |
| ------ | ---- |
| `assets/` | 靜態資源（SVG、全域樣式）。 |
| `components/` | 共用 Vue 元件與模組化對話框。 |
| `composables/` | 可重用的 Composition API hooks。 |
| `config/` | 固定配置（如車輛欄位定義）。 |
| `design/` | Design System：tokens 與基礎 UI 元件。 |
| `layouts/` | 頁面框架（AppShell）。 |
| `lib/` | API、Fernet、token 管理等工具函式。 |
| `ml/` | 瀏覽器端 ONNX 推論封裝。 |
| `mocks/` | MSW handler 與啟動腳本。 |
| `pages/` | 路由頁面元件。 |
| `router/` | Vue Router 設定與守衛。 |
| `services/` | Koala API 客戶端、WebSocket 封裝。 |
| `stores/` | Pinia stores，管理各模組狀態。 |
| `types/` | 共享的 TypeScript 型別定義。 |

## 其他檔案
- `App.vue`, `main.ts`：應用程式入口。
- `style.css`：全域樣式（含 UnoCSS resets）。
- `vite-env.d.ts`：Vite & TS 聯繫設定。

> 各子目錄皆補充對應的 README，介紹檔案用途與開發注意事項。
