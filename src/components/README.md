# src/components/

共用 Vue 元件集合，依功能劃分多個子資料夾（map、charts、modals 等）。所有元件以 `<script setup>` + TypeScript 實作，並搭配 UnoCSS。`.vue.js` 檔為 `vue-tsc -b` 產出的對應 JS，供 Node 工具或測試載入。

## 主要檔案
- `PaginationBar.vue`：分頁控制器。
- `VehicleBadges.vue`：顯示車輛狀態徽章。
- `ToastHost.vue`：全域通知容器，由 `src/stores/toasts.ts` 控制。
- `TestRegistration.vue`：註冊流程調試用元件。

## 子資料夾
- `charts/`：ECharts wrapper（如 `SocTrend.vue`, `CarbonBar.vue`）。
- `filters/`：車輛篩選器與軌跡查詢表單。
- `map/`：MapLibre 地圖元件。
- `modals/`：車輛詳情、遙測裝置設定等對話框。
- `profile/`：個人資料編輯。
- `rent/` / `returns/`：租借與還車流程。
- `kpi/`：指標卡片等 UI。

> 新增共用元件時，請更新此 README 並考慮是否需要對應的 Pinia store 或型別定義。
