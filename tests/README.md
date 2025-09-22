# tests/

整合測試資源、API 錄製樣本與手動工具。

## 結構
- `koala_samples/`：Koala API 回應的 JSON 快照，依端點與時間戳記命名，可供 MSW mock 或除錯使用。
- `koala_ws_tester.py`：連線 Koala WebSocket（`/ws/bike/error-logs/`）的測試腳本，支援 Fernet 加密登入。
- `koala_ws_test_*.log`：WebSocket 測試輸出。
- `manual/`：以 Python 撰寫的手動檢查腳本，例如 `unwired_api_check.py`。

## 推薦流程
1. 執行 `npm run dev:mock`，確認前端使用最新的樣本資料。
2. 若測得新的 API 回應，將 JSON 放入 `koala_samples/` 並更新命名。
3. 使用 `tests/koala_ws_tester.py --help` 了解可用參數，測試遙測串流。

> 未來如新增自動化測試，建議以 `tests/` 作為資料來源或基準，維持與 Koala 平台的一致性。
