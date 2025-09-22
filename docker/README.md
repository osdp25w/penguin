# docker/

輔助 Docker / Nginx 設定與工具腳本。

- `nginx-fernet.js`：將敏感字串以 Fernet 加密後輸出 JSON，方便在 Nginx 設定中以子進程生成密文。
  ```bash
  echo '{"text":"password","key":"<base64-key>"}' | node docker/nginx-fernet.js
  ```
  輸出格式：`{"token":"..."}`。

其他 Docker 配置集中在專案根目錄的 `Dockerfile`、`docker-compose*.yml` 以及 `deploy/` 的 K8s 設定。
