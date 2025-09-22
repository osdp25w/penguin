# src/stores/

Pinia store 集合，管理應用程式狀態與 API 互動。

主要 store：
- `auth.ts`：登入狀態、token refresh、角色權限判斷。
- `vehicles.ts`：車輛清單、篩選條件、詳情資料。
- `sites.ts`：站點資料與地圖資訊。
- `alerts.ts`：警報列表、狀態更新。
- `rentals.ts` / `returns.ts`：租借、還車流程。
- `users.ts`：管理員/會員資料管理。
- `ml.ts`：追蹤模型載入狀態與結果。
- `telemetry.ts`：遙測設備與 WebSocket 連線狀態。
- `summary.ts`：儀表板 KPI 與趨勢資料。
- `toasts.ts`：全域提示訊息列隊。

`index.ts` 提供聚合匯出與初始化 helper。`.js` 檔案為 TS 編譯輸出。

> 新增 store 時，請遵循 `defineStore` 模式並於此 README 說明用途，方便其他開發者理解資料流向。
