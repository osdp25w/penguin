# public/

Vite 靜態資產根目錄，建置時會原樣複製到 `dist/`。

## 主內容
- `index.html`：Vite 入口模板（建置時由 Vite 產出 HTML）。
- `mockServiceWorker.js`：MSW build 輸出，`npm run dev:mock` 會註冊此 worker。
- `models/`：ONNX 模型與 metadata，供 `src/ml/` 載入（詳見 `public/models/README.md`）。

## 手動測試頁
這些 HTML 用於整合或手動測試，不會載入主應用：
- `admin-test.html`、`user-management-test.html`：帳號管理情境驗證。
- `api-test.html`、`direct-api-test.html`：測試 Koala REST API 呼叫與 Fernet 加密流程。
- `token-test.html`、`final-auth-test.html`：Token refresh 與登入流程除錯。
- `member-debug.html`、`profile-test.html` 等：會員端體驗、表單與 Fernet 解密確認。

使用方式：直接以瀏覽器開啟，或透過 `npm run dev` 後訪問對應路徑（例如 `http://localhost:5173/admin-test.html`）。

> 若新增其他測試頁，請在此 README 補充目的與操作方式，避免被誤認為正式頁面。
