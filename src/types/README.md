# src/types/

跨模組共用的 TypeScript 型別定義。

- `vehicle.ts`：車輛、電池、狀態列舉等型別。
- `alert.ts`：警報項目、嚴重度、處理狀態。
- `rental.ts`：租借、還車、會員紀錄結構。
- `site.ts`：站點、站點統計與地理資訊。
- `index.ts`：集中 re-export，提供 `@/types` 統一入口。

`.js` 檔來自 TS 編譯輸出，可提供給純 JS 腳本使用。

> 當 API schema 變更時，請更新型別並同步調整使用處（stores、components）。
