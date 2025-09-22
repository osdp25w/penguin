# src/components/rent/

前台與管理員的租借流程元件。

- `RentDialog.vue`：會員租借申請流程（輸入車號、身份驗證、FERNET 加密敏感欄位）。
- `RentModal.vue`：管理員側租借操作，支援選擇會員與車輛。
- `RentSuccessDialog.vue`：租借成功顯示與後續指引。

依賴 Pinia store：`src/stores/rentals.ts`，用於讀取租借狀態與提交 API。

> 若調整租借流程（例如新增支付步驟），請在此 README 更新流程描述並檢查 store / services 邏輯。
