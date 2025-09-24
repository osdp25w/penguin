# src/services/

封裝與 Koala 平台相關的服務。

- `koala.ts`：REST API client，提供登入、會員/員工 CRUD、租借檢查等功能。支援瀏覽器端 Fernet 加密，並保存 refresh/access token。
- `koala_ws.ts`：WebSocket utility，用於連接 Koala 遙測錯誤日誌 (`/ws/bike/error-logs/`)。
- `koala_realtime_ws.ts`：即時車輛狀態串流工具，訂閱 `/ws/bike/realtime-status/` 更新。
- `koala.js` / `koala_ws.js`：TypeScript 編譯輸出。

服務與 `src/lib/api.ts` 搭配運作，確保統一的 base URL 與錯誤處理。

> 若新增新端點，建議在此建立對應函式並在 Pinia store 中使用，避免在元件內直接呼叫 fetch。
