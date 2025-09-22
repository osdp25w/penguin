# src/lib/

底層工具與 API 包裝函式。

- `api.ts`：封裝 Koala REST API 呼叫，處理 base URL、Authorization、Fernet 自動解密與 token 管理。
- `api-debug.ts`：輸出額外除錯資訊的版本，供調試使用。
- `encryption.ts` / `fernet.ts` / `fernet_client.ts`：瀏覽器端 Fernet 加解密工具。
- `http-interceptor.ts`：對 fetch 請求做攔截與錯誤處理的 helper。
- `token-auto-refresh.ts`：協助判斷 access token 是否即將過期並觸發刷新。
- `phone.ts`：電話號碼格式化與驗證工具。

檔案皆有 TypeScript 與對應的 emit `.js` 版本，以利在非 TS 環境重複使用。

> 新增工具時請注意勿直接在此層引入 Vue 相關依賴，避免循環相依。
