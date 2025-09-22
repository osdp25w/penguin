# deploy/

Kubernetes 與 CI/CD 相關設定。

## 檔案對照
- `Dockerfile-frontend`：CI 使用的建置流程，將 Vite 專案建成靜態檔案後以 Nginx 服務。
- `k8s-frontend.yaml`：前端 Deployment/Service/Ingress，並掛載 ConfigMap 與 Secret 提供 `config.public.js`、`config.secret.js`。
- `configmap-frontend.yaml`：以 ConfigMap 注入公開設定（API Base、Map 層等）。
- `secret-frontend.yaml`：定義需保密的 runtime 變數，如 Fernet key。
- `fernet-service.yaml`：獨立部署 Fernet 加解密 API（搭配 `secret-fernet.yaml` 提供金鑰）。
- `nginx-frontend.conf`：K8s 產線用 Nginx 設定，支援 gzip、SPA fallback 與 Cache-Control。
- `nginx-frontend.conf.backup`：前一版設定備份。
- `secret-fernet.yaml`：Fernet 服務使用的 Secret 樣板，需透過 `kubectl create secret` 或 CI 注入真實值。

## 建議流程
1. 於 CI 安全地注入 `VITE_*` 與 Fernet key，執行 `docker build -f deploy/Dockerfile-frontend` 產出映像。
2. 使用 Helm 或 kapp/kustomize 將 `k8s-frontend.yaml`、`fernet-service.yaml` 套用至目標叢集。
3. 透過 `configmap-frontend.yaml` / `secret-frontend.yaml` 管理環境差異；避免直接修改映像中的 `CONFIG`。

> 如需額外服務（例如 WebSocket Proxy、後端 API），請在此資料夾維護額外 manifest 並更新 README。
