# src/mocks/

Mock Service Worker (MSW) 設定，提供前端在無後端時的模擬 API。

- `browser.ts`：在開發模式註冊 MSW worker。
- `handlers/`：依模組拆分的 handler，例如 `vehicles.ts`, `alerts.ts`, `rentals.ts`。
- `handlers.ts`：聚合所有 handler，供 `msw` 啟動使用。

啟用方式：
- 以環境變數 `VITE_ENABLE_MOCK=true` 啟動開發伺服器，或執行 `npm run dev:mock`。
- 可搭配 `VITE_SEED_MOCK` 控制 Faker seed，使生成資料可重現。

> 當 Koala API 結構更新時，請同步更新對應 handler 與 `tests/koala_samples/` 的樣本資料。
