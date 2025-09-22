# src/router/

Vue Router 設定與權限守衛。

- `index.ts`：定義所有路由、動態 import 頁面與全域 `beforeEach` 守衛。
- `index.js`：TypeScript 編譯輸出。

守衛重點：
- `meta.requiresAuth`：需登入才可訪問。
- `meta.requiresAdmin`：限制 `admin` / `staff` 角色。未授權會導向 `/403`。
- `meta.memberOnly`：僅限 `member` 角色的頁面（例如 `/my-rentals`）。
- 自動設定 `document.title`，並在導覽時輸出除錯資訊（方便追蹤權限問題）。

> 新增路由請務必設定適當的 `meta` 權限、title，並確認 `AppShell` 選單同步更新。
