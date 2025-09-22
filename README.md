# Penguin 智慧電動自行車營運平台

Penguin 是嘉大數據平台的前端專案，提供電動自行車車隊的營運監控、租借管理與資料洞察。專案以 Vue 3 + TypeScript + Vite 為核心，結合 UnoCSS、MapLibre、ECharts 與 ONNX Runtime Web，支援即時遙測、Fernet 加密、機器學習推論以及多角色權限流程。

> 本 README 著重於專案的實作內容與開發流程，原有的企劃型文件可參考 `1140715嘉大數據平台功能定義/`。

---

## 目錄
- [核心功能一覽](#核心功能一覽)
- [技術堆疊](#技術堆疊)
- [系統架構概覽](#系統架構概覽)
- [專案目錄導覽](#專案目錄導覽)
- [環境需求與安裝](#環境需求與安裝)
- [開發與建置流程](#開發與建置流程)
- [測試與品質控管](#測試與品質控管)
- [模擬資料與 MSW](#模擬資料與-msw)
- [機器學習模型](#機器學習模型)
- [Fernet 加解密服務](#fernet-加解密服務)
- [Docker 與部署](#docker-與部署)
- [環境變數](#環境變數)
- [安全性備註](#安全性備註)
- [後續工作建議](#後續工作建議)

---

## 核心功能一覽
- **總覽儀表板 (`/`)**：顯示營運 KPI、SoC 與減碳趨勢。使用 `src/stores/summary.ts` 取得彙總數據，圖表採 ECharts 組件 (`src/components/charts/`)。
- **場域地圖 (`/sites`)**：MapLibre + NLSC WMTS 圖層呈現站點，支援站點卡片、狀態濾鏡、群集與 tooltip。相關程式位於 `src/components/map/` 與 `src/pages/SiteMap.vue`。
- **車輛清單 (`/vehicles`)**：Pinia store (`src/stores/vehicles.ts`) 連動篩選、分頁、批次操作與車輛詳情 modal。
- **租借流程**：
  - 會員租借紀錄 (`/my-rentals`) 與會員端流程 (`src/components/rent/`)
  - 管理員租借面板 (`/admin/rentals`) 與還車流程 (`src/components/returns/`)
- **警報中心 (`/alerts`)**：整合即時與歷史警報、依嚴重度分類與解決流程。
- **ML 預測 (`/ml`)**：呼叫 `src/ml/runners.ts` 封裝的 ONNX 模型推論，對行車範圍、碳排與電池壽命提出預估。
- **帳號 / 站點 / 遙測設備管理 (`/admin/*`)**：整合 Koala API 的管理頁，包含密碼重設、角色切換與遙測裝置啟用。

---

## 技術堆疊
- **框架**：Vue 3 (`<script setup>`)、Pinia、Vue Router 4
- **語言**：TypeScript，並保留 `vue-tsc -b` 產生的 JS 產物（方便在 Node/工具腳本中引用）
- **樣式 / UI**：UnoCSS、Design System (`src/design/`)、Headless UI、Iconify + Lucide
- **地圖**：MapLibre GL JS，支援 EMAP/EMAP2/PHOTO2 WMTS 圖層
- **圖表**：Apache ECharts (`vue-echarts`)
- **資料模擬**：Mock Service Worker + Faker.js (`src/mocks/`)
- **測試**：Vitest + Testing Library、Cypress e2e、手動測試腳本 (`public/*.html`, `tests/`)
- **機器學習**：ONNX Runtime Web、`ml/` 內的訓練腳本與推論封裝
- **支援服務**：Express-based Fernet API (`server/`)、Docker & K8s 部署樣板 (`Dockerfile`, `deploy/`)

---

## 系統架構概覽
```
┌───────────────────────────────┐
│          前端 (Vue)          │
│ - Router / Layout             │
│ - Pinia Stores                │
│ - Components & Design System  │
│ - MapLibre / ECharts          │
│ - ML 推論 (ONNX Web)          │
└─────────────┬─────────────────┘
              │ HTTP / WebSocket
┌─────────────▼─────────────────┐
│          Koala API            │
│ - 帳號 / 車輛 / 警報等 REST   │
│ - WebSocket 遙測             │
└─────────────┬─────────────────┘
              │ Fernet 加密
┌─────────────▼─────────────────┐
│ penguin/server Fernet Service │
│ - 密碼/敏感資訊加解密         │
└─────────────┬─────────────────┘
              │
┌─────────────▼─────────────────┐
│ 機器學習資源 (`public/models`) │
│ - ONNX 模型                   │
│ - `scripts/export_battery...` │
└───────────────────────────────┘
```

- 前端直接呼叫 Koala API (`src/lib/api.ts`)，並透過 Fernet key 於瀏覽器端或自建服務進行敏感資訊加解密。
- Mock 模式 (`VITE_ENABLE_MOCK=true`) 會啟動 MSW，從 `src/mocks/handlers/` 提供虛擬 API。
- ML 模型由 `src/ml/runners.ts` 載入 `public/models/*.onnx`，可 fallback 至啟發式計算。

---

## 專案目錄導覽
> 詳細說明請參閱各資料夾內新增的 `README.md`。

| 路徑 | 說明 |
| ---- | ---- |
| `src/` | 應用程式原始碼。子資料夾（stores、components、pages、ml...）皆有 README 與結構描述。 |
| `public/` | 靜態資源、測試頁面、ONNX 模型。 |
| `server/` | Node/Express Fernet 加解密微服務。 |
| `scripts/` | 資料科學與工具腳本。 |
| `cypress/` | E2E 測試設定與範例。 |
| `tests/` | API 錄製樣本、WebSocket 測試腳本與手動檢查工具。 |
| `deploy/` | K8s manifests、ConfigMap/Secret 樣板與 Dockerfile。 |
| `cert/` | 本地 TLS 憑證（dev.crt/dev.key）。 |
| `1140715嘉大數據平台功能定義/` | 需求簡報截圖。 |

---

## 環境需求與安裝
- Node.js 18.18+（建議 20.x，與 Dockerfile 相同）
- npm 9+（亦可使用 pnpm 8+/yarn，範例以 npm 為主）
- 若啟用 Fernet 服務：需 `openssl`（Docker dev 映像已內建）

```bash
# 取得原始碼
git clone <repo-url>
cd penguin

# 安裝依賴（會使用 package-lock）
npm ci
```

---

## 開發與建置流程
```bash
# 啟動開發伺服器（預設 http://localhost:5173）
npm run dev

# 啟動並載入 Mock 資料（會注入種子資料、站點與 42 台車輛）
VITE_ENABLE_MOCK=1 VITE_SEED_MOCK=1 npm run dev
# 或使用 package script
npm run dev:mock

# 型別檢查
npx vue-tsc --noEmit

# 建置生產版
npm run build

# 預覽 dist 輸出
npm run preview
```

### Docker 開發模式
```bash
docker compose up dev
# 搭配 docker-compose.dev.yml 載入 .env：
docker compose -f docker-compose.yml -f docker-compose.dev.yml up dev
```

`Dockerfile` 內含 dev/production 多階段建置；dev stage 會自動產生開發憑證。

---

## 測試與品質控管
- **單元 / 組件測試**：`npm run test:unit`（Vitest + Testing Library，範例位於 `src/design/components/__tests__/`）。
- **端對端測試**：`npm run test:e2e` 以 Cypress 開啟互動視窗，預設 baseUrl `http://localhost:5173`。
- **整合測試樣本**：`tests/koala_samples/` 蒐集 Koala API 回應 JSON，供 mock 與迴歸驗證使用。
- **WebSocket 測試**：`tests/koala_ws_tester.py` 可驗證遙測錯誤日誌的 WS 串流。
- **手動測試頁**：`public/*.html` 提供前端表單與 API 行為的快速驗證。

---

## 模擬資料與 MSW
- 啟用方式：設定 `VITE_ENABLE_MOCK=true`（`npm run dev:mock` 已內建）。
- 處理流程：`src/mocks/browser.ts` 啟動 MSW，個別 handler 位於 `src/mocks/handlers/`。
- Mock 資料由 Faker.js 生成，並透過 `VITE_SEED_MOCK` 控制 deterministic seed；站點地理資料取自花蓮地區測試資料集。

---

## 機器學習模型
- 推論封裝：`src/ml/runners.ts`, `src/ml/featurizer.ts`。
- 模型儲存：`public/models/*.onnx`。若模型不存在，前端改用啟發式計算（保證 UI 不會失效）。
- 訓練腳本：`scripts/export_battery_model.py` 讀取 `battery_aging/discharge.csv`，訓練隨機森林並匯出 ONNX 與 metadata。
- 模型 I/O schema：`ml/schemas.md`。

---

## Fernet 加解密服務
- 位置：`server/index.js`（Express 伺服器）。
- 功能：提供 `/api/fernet/encrypt` 與 `/api/fernet/decrypt`，支援 password/sensitive 兩組 key，自動判斷與 batch decrypt。
- 啟動：
  ```bash
  cd server
  npm install  # 僅需一次（package.json 提供 minimal deps）
  KOALA_LOGIN_KEY=<base64-url-key> KOALA_SENSITIVE_KEY=<base64-url-key> node index.js
  # 預設在 http://localhost:3001
  ```
- 前端在 `src/lib/api.ts` / `src/services/koala.ts` 中可選用瀏覽器端或此服務進行 Fernet 加解密。

---

## Docker 與部署
- `docker-compose.yml`：提供 `dev`、`production`、`production-ssl` 三個服務設定。
- `deploy/`：
  - `Dockerfile-frontend`：CI/CD 專用的建置流程。
  - `k8s-frontend.yaml`：Deployment + Service + Ingress，使用 ConfigMap/Secret 置入 `config.public.js` / `config.secret.js`。
  - `fernet-service.yaml`：部署 Fernet API，搭配 `secret-fernet.yaml` 注入 key。
  - `configmap-frontend.yaml` / `secret-frontend.yaml`：提供前端 runtime config。
- 如需 TLS，可使用 `production-ssl` profile 並掛載 `cert/` 目錄的自簽憑證或正式憑證。

---

## 環境變數
| 變數 | 預設/範例 | 說明 |
| ---- | --------- | ---- |
| `VITE_BASE_URL` | `/api/v1` | 前端相對 API 路徑（搭配反向代理使用）。 |
| `VITE_KOALA_BASE_URL` | `https://koala.osdp25w.xyz` | Koala API 入口，支援 http(s)/ws(s)。 |
| `VITE_ENABLE_MOCK` | `true` / `false` | 啟用 MSW Mock。 |
| `VITE_SEED_MOCK` | `1` | Faker seed。 |
| `VITE_SEED_REGION` | `hualien` | 測試地理資料區域。 |
| `VITE_MAP_PROVIDER` | `maplibre` | 地圖實作，目前支援 `maplibre`。 |
| `VITE_EMAP_LAYER` | `EMAP` | NLSC 圖層：`EMAP` / `EMAP2` / `PHOTO2`。 |
| `VITE_EMAP_MATRIXSET` | `GoogleMapsCompatible` | WMTS matrix-set。 |
| `VITE_MAP_CENTER` | `23.8,121.6` | 地圖中心點 (lat,lng)。 |
| `VITE_MAP_ZOOM` | `10` | 初始縮放。 |
| `VITE_AUTO_CERT` | `1` | 開發模式自動產生 TLS 憑證。 |
| `VITE_KOALA_LOGIN_KEY` | *(無預設)* | Fernet key（base64-url，32 bytes）用於登入/密碼加密。 |
| `VITE_KOALA_SENSITIVE_KEY` | *(無預設)* | Fernet key 用於身份證/電話等敏感資訊。 |
| `VITE_KOALA_FORCE_FERNET_TS` / `VITE_KOALA_FORCE_FERNET_IV` | *(選用)* | Dev 用 deterministic Fernet，對齊後端重播需求。 |
| `VITE_KOALA_FORCE_FERNET_COMPAT` | `0` | 是否啟用與後端相容的 padding。 |
| `KOALA_LOGIN_KEY` / `KOALA_SENSITIVE_KEY` | *(server)* | `server/index.js` Fernet 服務使用的 key。 |

> 產線環境建議使用 ConfigMap + Secret 注入上述變數，實際範例可見 `deploy/` 內檔案。

---

## 安全性備註
- Fernet key 必須以 **URL-safe base64** 表示 32 bytes；建議在 CI/CD 中以 Secret 管理，勿硬編碼。
- `cert/` 內的 dev 憑證僅供本地開發，勿用於正式環境。
- `tests/koala_samples/` 含有實際 API 回應，若含敏感資料請再行清理或改為匿名化。
- 前端會將 access token 儲存在 `localStorage`，若部署於多子網域需考量相同來源政策。

---

## 後續工作建議
1. **擴充測試覆蓋率**：目前 Vitest 案例集中在 Design System，建議為主要頁面撰寫單元 / e2e 測試。
2. **改善 MSW 資料來源**：將 `tests/koala_samples/` JSON 自動輸入 mock handler，維持與真實 API 對齊。
3. **自動化部署**：以 GitHub Actions / GitLab CI 整合 `Dockerfile-frontend` 與 K8s manifests。
4. **安全掃描**：加入依賴安全性掃描（Snyk, npm audit）與 secret 檢測。
5. **多角色 UX**：針對 `member` / `staff` 權限提供更清楚的 UI 提示與導覽。

---

如需了解特定子系統，請參考對應資料夾內的 README。若有任何疑問或建議，歡迎提交 Issue 或 PR 🙌
