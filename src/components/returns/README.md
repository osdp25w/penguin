# src/components/returns/

還車流程元件，供前台與管理員檢視或完成歸還。

- `ReturnFlow.vue`：整合所有步驟（檢查租借、確認狀態、送出歸還）。
- `ReturnModal.vue`：管理員操作入口，與租借清單結合。
- `ReturnConfirmDialog.vue` / `ReturnSuccessDialog.vue`：顯示確認與成功訊息。
- `SimpleReturnDialog.vue`：會員端簡化流程。

依賴 Pinia store：`src/stores/returns.ts`、`src/stores/rentals.ts`，並整合 Koala API 的租借端點。

> 當後端流程變更（例如新增檢修紀錄），請同步調整 store 與此 README。
