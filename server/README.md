# server/

Express 實作的 Fernet 加解密 API，供前端或測試工具呼叫。

## 指令
```bash
cd server
npm install          # 安裝 minimal 依賴
KOALA_LOGIN_KEY=... KOALA_SENSITIVE_KEY=... node index.js
```
預設監聽 `0.0.0.0:3001`。

## 環境變數
- `KOALA_LOGIN_KEY`：登入／密碼使用的 Fernet key（base64-url, 32 bytes）。
- `KOALA_SENSITIVE_KEY`：身份證、電話等敏感資料使用的 Fernet key。
- `PORT`（可選）：自訂服務埠號。

## API
- `GET /health`：健康檢查。
- `POST /api/fernet/encrypt`：輸入 `{ text, key?, type }`，回傳 `{ token }`。
  - `type` 支援 `password`（預設）、`sensitive`、`national_id`。
  - 若未傳 `key`，會依 `type` 選擇對應的環境變數。
- `POST /api/fernet/decrypt`：輸入 `{ tokens: string[], key?, type }`，回傳 `{ values }`。
  - 支援批次解密與 `auto` 模式（依序嘗試敏感 key、登入 key）。

> 此服務僅處理 Fernet 邏輯，不含身份驗證。建議部署於保護的內部網段或搭配 API Gateway。
