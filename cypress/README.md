# cypress/

端對端測試設定與案例。專案目前包含一個示範測試，驗證場域地圖頁面在啟動 MSW mock 時的互動行為。

## 結構
- `cypress.config.ts`：Cypress 10+ 設定檔，指定 `baseUrl` 為 `http://localhost:5173`。
- `e2e/siteMap.cy.ts`：範例場景，覆蓋地圖標記載入與站點詳情面板。

## 執行
```bash
# 互動模式（建議用於開發調試）
npm run test:e2e

# 若要 headless 執行，可指定瀏覽器
npx cypress run --browser electron --spec cypress/e2e/siteMap.cy.ts
```

> 執行測試前請啟動開發伺服器，或調整 `baseUrl` 指向靜態建置結果。
