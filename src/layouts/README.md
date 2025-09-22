# src/layouts/

應用程式的頁面框架。

- `AppShell.vue`：主框架，包含頂部導覽列、側邊導覽、breadcrumb 與 `<router-view>`。負責依權限顯示不同選單項目，並整合全域通知 (`ToastHost`)。

如需新增多重 layout，可在此資料夾建立額外檔案並在 `src/router/index.ts` 指定。
