# src/components/profile/

個人資料與帳密相關元件。

- `EditProfileModal.vue`：編輯姓名、電話、密碼等資訊；使用 Fernet 解密後顯示原始資料。

支援功能：
- 透過 `src/stores/auth.ts` 載入目前登入者資料。
- 與 `src/services/koala.ts` `updateMember`/`updateStaff` API 協作。
- 具備前端格式驗證並提示錯誤。

> 若後端欄位新增（例如地址、頭像），請在此元件與 README 更新對應說明。
