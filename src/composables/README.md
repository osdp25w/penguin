# src/composables/

可重用的 Composition API 工具。

- `usePaging.ts`：封裝分頁邏輯（當前頁、總筆數、每頁大小、跳頁方法），供車輛、租借等列表使用。

> 若新增共用邏輯，建議以 `useXxx.ts` 命名，並在此說明參數與回傳值。
