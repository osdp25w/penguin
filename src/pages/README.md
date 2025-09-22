# src/pages/

對應路由的頁面元件。檔案多以 `Composition API + <script setup>` 撰寫，並依需求搭配 Pinia stores。

## 主要路由
- `Overview.vue`：總覽儀表板（KPI、SoC、減碳趨勢）。
- `SiteMap.vue`：場域地圖與站點詳情。
- `Vehicles.vue`：車輛列表、篩選與詳情 modal。
- `Alerts.vue`：警報中心（依嚴重度分類、處理流程）。
- `MLPredict.vue`：展示 ML 預測結果與模型狀態。
- `UserManagement.vue`：帳號管理（admin 專用）。
- `SiteManagement.vue`、`TelemetryDevices.vue`、`RentalManagement.vue`：站點、遙測設備與租借管理。
- `MyRentals.vue`：會員租借紀錄。
- `Login.vue`：登入頁，內建 Fernet 密碼加密。

## 其他頁面
- `BatteryHealth.vue`, `BatteryFailure.vue`：電池健康/故障分析頁面（原型）。
- `SimpleTest.vue`, `SiteManagementTest.vue`, `TelemetryDevicesTest.vue`：調試/原型頁。
- `Forbidden.vue`：403 權限不足頁面。

`.vue.js` 檔為 TS 編譯輸出，可忽略。

> 更新路由時，請同步檢查 `src/router/index.ts` 與對應 store 權限設定。
