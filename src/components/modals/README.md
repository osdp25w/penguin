# src/components/modals/

系統中主要互動對話框，負責顯示或編輯詳細資訊。

- `VehicleDetailModal.vue`：呈現車輛即時資訊、Fernet 解密後的敏感資料。
- `CreateVehicleModal.vue`：新增車輛表單，提供欄位驗證與表單送出。
- `TelemetryDeviceModal.vue`：管理遙測裝置狀態、IMEI 與配置。
- `SetupGuideModal.vue`、`SeedGuideModal.vue`：引導首次設定或載入測試資料。

共通特徵：
- 使用 Design System 的 `Card`/`Button`，並配合 UnoCSS utility。
- 透過 props 與 emits 控制對話框開關，並整合 Pinia stores 進行資料存取。

> 對話框涉及 API 呼叫時，務必透過 `src/services/` 或 `src/stores/`，避免在元件中直接呼叫 fetch。
