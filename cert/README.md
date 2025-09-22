# cert/

本目錄存放開發與測試用的 TLS 憑證：

- `dev.crt` / `dev.key`：`npm run dev` 或 Docker dev stage 產出的自簽憑證，適用於本機 HTTPS。
- `openssl.cnf`：自動產生憑證時使用的 OpenSSL 設定。

注意事項：
- 自簽憑證僅供本機開發測試，勿部署到正式環境。
- 若需替換為正式憑證，請保持檔名一致或於 `docker-compose.yml` / `vite.config.ts` 中更新掛載路徑。
- 建議在 `.gitignore` 中排除任何私鑰備份或正式憑證。
