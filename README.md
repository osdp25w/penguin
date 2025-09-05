# Penguin Dashboard 🐧🚴

**Penguin Dashboard** 是一個針對電動自行車車隊管理的現代化儀表板應用程式。專為「嘉大數據平台」設計，提供車輛監控、電池健康狀態、警報通知以及資料分析等功能，並內建模擬 API 供開發測試使用。專案採用 Vue 3 + TypeScript + UnoCSS 技術棧，搭配 Design System v2.0 提供優異的用戶體驗。

## 🚀 專案特色

### 核心功能
- **📊 總覽儀表板**：即時 KPI 監控，包含在線車輛數、總行駛距離、減碳量等關鍵指標
- **🗺️ 場域地圖**：基於 MapLibre + NLSC EMAP 的互動式地圖，支援車輛即時位置追蹤
- **🚴 車輛管理**：8欄位表格式管理介面（名稱、ID、SoC、Motor、Battery、Controller、Port、MQTT）
- **⚡ 電池健康**：完整的電池健康度監控，包含 SOH、充放電循環、溫度等數據
- **🚨 警報中心**：三級警報分類（危急事件、警告事件、提醒事件）與統計卡片
- **🤖 ML 預測分析**：路線規劃、碳排放預估、電力消耗分析等智能功能
- **👥 帳號管理**：角色權限控制（管理員、管理者、一般用戶）

### 技術亮點
- **🎨 Design System v2.0**：統一的設計語言與元件庫
- **📱 響應式設計**：支援桌面、平板、手機等多種螢幕尺寸
- **🗾 台灣地圖整合**：使用內政部國土測繪中心 WMTS 服務
- **🔄 即時資料更新**：WebSocket 支援與自動刷新機制
- **🎯 TypeScript 全覆蓋**：完整的型別安全保障
- **⚡ 高效能**：基於 Vite 的快速開發體驗

## 🛠️ 技術架構

### 前端技術棧
- **框架**：Vue 3 (Composition API + `<script setup>`)
- **語言**：TypeScript
- **構建工具**：Vite
- **樣式框架**：UnoCSS (原子化 CSS)
- **狀態管理**：Pinia
- **路由**：Vue Router 4
- **UI 組件**：Headless UI + 自建 Design System
- **地圖**：MapLibre GL JS + NLSC EMAP
- **圖表**：Apache ECharts
- **圖標**：Phosphor Icons

### 開發工具
- **Mock API**：Mock Service Worker (MSW) + Faker.js
- **測試資料**：42輛車輛，涵蓋花蓮地區真實座標
- **型別檢查**：vue-tsc
- **代碼格式化**：Prettier（可選）
- **Git 工作流**：Feature branch + Pull Request

## 📦 安裝與啟動

### 環境準備
```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (推薦) 或 npm/yarn
```

### 快速開始
```bash
# 1. Clone 專案
git clone https://github.com/osdp25w/penguin.git
cd penguin

# 2. 安裝依賴
pnpm install

# 3. 複製環境變數檔案
cp .env.example .env

# 4. 啟動開發服務器（含 Mock 資料）
pnpm dev:mock

# 5. 瀏覽器開啟 http://localhost:5173
```

### 開發指令
```bash
# 正常開發模式（空資料）
pnpm dev

# 測試資料模式（42輛車 + 花蓮座標）
pnpm dev:mock

# 型別檢查
pnpm type-check

# 建置正式版本
pnpm build

# 預覽建置結果
pnpm preview
```

## 🌍 環境變數設定

在 `.env` 檔案中設定以下變數：

```bash
# API 設定
VITE_BASE_URL=/api/v1
VITE_ENABLE_MOCK=true

# 測試資料設定
VITE_SEED_MOCK=1          # 0=空資料, 1=完整測試資料
VITE_SEED_REGION=hualien  # 測試資料區域

# 地圖設定
VITE_MAP_PROVIDER=maplibre
VITE_EMAP_LAYER=EMAP                    # EMAP | EMAP2 | PHOTO2
VITE_EMAP_MATRIXSET=GoogleMapsCompatible
VITE_MAP_CENTER=23.8,121.6              # 花蓮中心點
VITE_MAP_ZOOM=12

# Google Maps API（選用）
VITE_GOOGLE_MAPS_KEY=your_api_key_here
```

## 🗺️ 地圖服務設定

本專案使用 **內政部國土測繪中心（NLSC）** 的臺灣通用電子地圖（EMAP）：

### 可用圖層
- **EMAP**：完整電子地圖（預設）
- **EMAP2**：透明版電子地圖
- **PHOTO2**：正射影像圖

### WMTS 服務規格
```
URL 格式：https://wmts.nlsc.gov.tw/wmts/{LayerName}/default/{MatrixSet}/{z}/{y}/{x}
座標系統：EPSG:3857 (Web Mercator)
矩陣集：GoogleMapsCompatible
```

## 🔐 使用者權限系統

### 預設測試帳號
```bash
# 管理員帳號
Email: admin@example.com
Password: admin123

# 一般管理者
Email: manager@example.com  
Password: manager123

# 一般使用者
Email: user@example.com
Password: user123
```

### 角色權限
| 功能模組 | admin | manager | user |
|---------|-------|---------|------|
| 總覽儀表板 | ✅ | ✅ | ✅ |
| 場域地圖 | ✅ | ✅ | ✅ |
| 車輛管理 | ✅ | ✅ | 📖 |
| 警報中心 | ✅ | ✅ | 📖 |
| ML 預測 | ✅ | ✅ | 📖 |
| 帳號管理 | ✅ | ❌ | ❌ |

*📖 = 僅限檢視*

## 🎨 Design System v2.0

### 設計原則
- **一致性**：統一的視覺語言與互動模式
- **可及性**：符合 WCAG 2.1 AA 標準
- **響應式**：適配各種裝置與螢幕尺寸
- **效能優先**：最佳化的載入與渲染效能

### 色彩系統
```css
/* 主色調 */
--color-primary: #6366f1    /* Indigo-500 */
--color-primary-dark: #4f46e5

/* 狀態色彩 */
--color-success: #10b981    /* Green-500 */
--color-warning: #f59e0b    /* Yellow-500 */
--color-danger: #ef4444     /* Red-500 */
--color-info: #3b82f6       /* Blue-500 */

/* 中性色彩 */
--color-gray-50: #f9fafb
--color-gray-900: #111827
```

### 元件庫
- **Button**：多種樣式與尺寸選擇
- **Card**：統一的卡片容器
- **Modal**：可客製化的對話框
- **Table**：響應式表格組件
- **Form**：表單輸入元件集合

## 📡 完整 API 文檔

本節記錄系統中使用的所有 API 端點、請求格式、回應格式與資料結構。

### 🔐 認證 API

#### 登入
```http
POST /api/v1/auth/login
Content-Type: application/json

# Request Body
{
  "email": "admin@example.com",
  "password": "admin123"
}

# Response (200)
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-001",
    "name": "系統管理員",
    "email": "admin@example.com",
    "roleId": "admin",
    "phone": "0912345678",
    "avatarUrl": null
  }
}

# Error Response (401)
{
  "message": "帳號或密碼錯誤"
}
```

#### 取得個人資料
```http
GET /api/v1/me
Authorization: Bearer {token}
Content-Type: application/json

# Response (200)
{
  "id": "user-001",
  "name": "系統管理員",
  "email": "admin@example.com",
  "roleId": "admin",
  "phone": "0912345678",
  "avatarUrl": null
}
```

#### 更新個人資料
```http
PUT /api/v1/me
Authorization: Bearer {token}
Content-Type: application/json

# Request Body
{
  "name": "新姓名",
  "email": "new@example.com",
  "phone": "0987654321",
  "currentPassword": "oldpass123",
  "password": "newpass456"
}

# Response (200)
{
  "id": "user-001",
  "name": "新姓名",
  "email": "new@example.com",
  "roleId": "admin",
  "phone": "0987654321",
  "avatarUrl": null
}
```

### 🚗 車輛管理 API

#### 取得車輛清單（支援篩選）
```http
GET /api/v1/vehicles/list?siteId={siteId}&status={status}&keyword={keyword}&soh_lt={number}

# 查詢參數
siteId   : string   (可選) 站點ID篩選
status   : string   (可選) 車輛狀態篩選
keyword  : string   (可選) 關鍵字搜尋
soh_lt   : number   (可選) SOH小於指定值

# Response (200)
[
  {
    "id": "KU-A_1234-01",
    "name": "東華站點01",
    "soc_pct": 85,
    "motor": "MOT01",
    "battery": "BAT01",
    "controller": "CTL01",
    "port": 1,
    "mqtt_ok": true,
    "lat": 23.8941,
    "lon": 121.5598,
    "status": "available",
    "registeredUser": null,
    "lastSeen": "2025-01-15T10:30:00Z",
    "siteId": "site-001",
    "motorStatus": "normal",
    "batteryStatus": "normal",
    "controllerStatus": "normal",
    "portStatus": "normal",
    "mqttStatus": "online",
    "soh": 92,
    "predictedRangeKm": 45,
    "chargeCycles": 156,
    "batteryTrend": [
      { "t": 1642204800, "v": 88 },
      { "t": 1642291200, "v": 85 }
    ]
  }
]
```

#### 取得站點車輛
```http
GET /api/v1/vehicles?siteId={siteId}&page={page}&size={size}

# 查詢參數
siteId : string (必要) 站點ID
page   : number (可選) 頁碼，預設 1
size   : number (可選) 每頁筆數，預設 20

# Response (200)
{
  "items": [...],  // 車輛陣列，格式同上
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

#### 取得車輛電池詳細資訊
```http
GET /api/v1/metrics/vehicle/{vehicleId}/battery

# Response (200)
{
  "vehicleId": "KU-A_1234-01",
  "soc": 85,
  "soh": 92,
  "temperature": 28.5,
  "voltage": 48.2,
  "current": 2.1,
  "chargeCycles": 156,
  "predictedRangeKm": 45,
  "predictedReplaceAt": "2026-03-15",
  "trend": [
    { "timestamp": 1642204800, "value": 88 },
    { "timestamp": 1642291200, "value": 85 }
  ],
  "lastUpdate": "2025-01-15T10:30:00Z"
}
```

### 🚨 警報管理 API

#### 取得警報列表
```http
GET /api/v1/alerts?resolved={boolean}&severity={severity}&siteId={siteId}&since={datetime}&limit={number}

# 查詢參數
resolved  : boolean (可選) true=已解決, false=未解決
severity  : string  (可選) info|warning|error|critical
siteId    : string  (可選) 站點ID篩選
since     : string  (可選) ISO時間，取得此時間後的警報
limit     : number  (可選) 限制回傳筆數

# Response (200)
[
  {
    "id": "alert-001",
    "siteId": "site-001",
    "vehicleId": "KU-A_1234-01",
    "severity": "critical",
    "type": "battery_temperature",
    "message": "電池溫度過高 (65°C)",
    "description": "電池放電溫度超過安全閾值",
    "resolved": false,
    "createdAt": "2025-01-15T10:30:00Z",
    "resolvedAt": null
  }
]
```

#### 確認/關閉警報
```http
PATCH /api/v1/alerts/{alertId}
Content-Type: application/json

# Request Body
{
  "state": "closed"
}

# Response (200)
{
  "id": "alert-001",
  "resolved": true,
  "resolvedAt": "2025-01-15T11:00:00Z"
}
```

### 🏢 站點管理 API

#### 取得站點列表
```http
GET /api/v1/sites?region={region}

# 查詢參數
region : string (可選) hualien|taitung

# Response (200)
[
  {
    "id": "site-001",
    "name": "東華大學站",
    "region": "hualien",
    "location": {
      "lat": 23.8941,
      "lng": 121.5598
    },
    "status": "active",
    "brand": "huali",
    "vehicleCount": 12,
    "availableCount": 8,
    "availableSpots": 4,
    "batteryLevels": {
      "high": 5,    // >70%
      "medium": 3,  // 30-70%
      "low": 0      // <30%
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
]
```

### 📊 統計與指標 API

#### 總覽統計
```http
GET /api/v1/metrics/summary

# Response (200)
{
  "online": 38,
  "offline": 4,
  "distance": 12584.7,  // 總行駛距離 (km)
  "carbon": 2516.94     // 減碳量 (kg)
}
```

### 🧠 機器學習預測 API

#### 路線規劃預測
```http
POST /api/v1/ml/strategy
Content-Type: application/json

# Request Body
{
  "distance": 15.5
}

# Response (200)
{
  "polyline": [
    { "lat": 23.8941, "lon": 121.5598 },
    { "lat": 23.8945, "lon": 121.5602 }
  ],
  "estTime": "28 分鐘",
  "estEnergy": "0.8 kWh"
}
```

#### 碳排放預估
```http
POST /api/v1/ml/carbon
Content-Type: application/json

# Request Body
{
  "distance": 10.2
}

# Response (200)
{
  "saved": 2.04  // 預估減碳量 (kg)
}
```

#### 電力消耗預測
```http
POST /api/v1/ml/power
Content-Type: application/json

# Request Body
{
  "speed": 25  // km/h
}

# Response (200)
{
  "kWh": 1.2,
  "nextCharge": "剩餘 38km 後需要充電"
}
```

#### 電池故障風險預測
```http
GET /api/v1/ml/battery

# Response (200)
[
  {
    "id": "KU-A_1234-01",
    "health": 92,
    "faultP": 0.12  // 故障機率 (0-1)
  }
]
```

### 👥 使用者管理 API

#### 取得使用者列表
```http
GET /api/v1/users

# Response (200)
[
  {
    "id": "user-001",
    "email": "admin@example.com",
    "fullName": "系統管理員",
    "roleId": "admin",
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-01-15T09:00:00Z"
  }
]
```

#### 取得角色列表
```http
GET /api/v1/roles

# Response (200)
[
  {
    "id": "admin",
    "name": "系統管理員",
    "desc": "具有完整系統權限",
    "scopes": ["read", "write", "delete", "admin"]
  },
  {
    "id": "manager",
    "name": "管理者",
    "desc": "具有管理權限，不含使用者管理",
    "scopes": ["read", "write"]
  },
  {
    "id": "user",
    "name": "一般使用者",
    "desc": "僅具有檢視權限",
    "scopes": ["read"]
  }
]
```

### 🔋 電池健康度 API

#### 取得電池統計
```http
GET /api/v1/batteries

# Response (200)
[
  {
    "id": "battery-001",
    "vehicleId": "KU-A_1234-01",
    "soc": 85,
    "temp": 28.5,
    "health": 92,
    "ts": "2025-01-15T10:30:00Z"
  }
]
```

### 🚲 租借系統 API

#### 建立租借
```http
POST /api/rentals
Content-Type: application/json

# Request Body
{
  "bikeId": "KU-A_1234-01",
  "userName": "張三",
  "phone": "0912345678",
  "idLast4": "1234"
}

# Response (201)
{
  "rentalId": "rental-001",
  "bikeId": "KU-A_1234-01",
  "userName": "張三",
  "phone": "0912345678",
  "idLast4": "1234",
  "state": "reserving",
  "startedAt": "2025-01-15T10:30:00Z"
}

# Error Response (409 - 車輛已被租借)
{
  "message": "車輛已被他人租借"
}

# Error Response (503 - 車輛離線)
{
  "message": "車輛離線，無法租借"
}
```

#### 解鎖車輛
```http
POST /api/rentals/{rentalId}/unlock
Content-Type: application/json

# Response (200)
{
  "rentalId": "rental-001",
  "state": "unlocking"
}
```

#### 取消租借
```http
POST /api/rentals/{rentalId}/cancel
Content-Type: application/json

# Response (200)
{
  "message": "租借已取消"
}
```

### 🔄 歸還系統 API

#### 歸還車輛
```http
POST /api/v1/returns
Content-Type: application/json

# Request Body
{
  "vehicleId": "KU-A_1234-01",
  "siteId": "site-002",
  "odometer": 45.8,
  "battery": 65,
  "issues": "車輪有輕微異音",
  "photos": ["https://example.com/photo1.jpg"]
}

# Response (201)
{
  "id": "return-001",
  "vehicleId": "KU-A_1234-01",
  "siteId": "site-002",
  "fromSiteId": "site-001",
  "odometer": 45.8,
  "battery": 65,
  "issues": "車輪有輕微異音",
  "photos": ["https://example.com/photo1.jpg"],
  "by": "user-001",
  "createdAt": "2025-01-15T11:00:00Z"
}
```

#### 取得歸還記錄
```http
GET /api/v1/returns?siteId={siteId}&limit={limit}

# 查詢參數
siteId : string (可選) 站點ID篩選
limit  : number (可選) 限制回傳筆數

# Response (200)
[
  {
    "id": "return-001",
    "vehicleId": "KU-A_1234-01",
    "siteId": "site-002",
    "fromSiteId": "site-001",
    "odometer": 45.8,
    "battery": 65,
    "issues": "車輪有輕微異音",
    "photos": ["https://example.com/photo1.jpg"],
    "by": "user-001",
    "createdAt": "2025-01-15T11:00:00Z"
  }
]
```

### 📡 WebSocket API

#### 警報即時推送
```javascript
// 連接 WebSocket
const ws = new WebSocket('ws://localhost:5173/stream/alerts')

// 接收警報推送
ws.onmessage = (event) => {
  const alert = JSON.parse(event.data)
  // alert 格式同 GET /api/v1/alerts 回應
}

// 接收感測器數據
ws.onmessage = (event) => {
  const sensorData = JSON.parse(event.data)
  // 格式：
  {
    "siteId": "site-001",
    "vehicleId": "KU-A_1234-01",
    "controllerTemp": 95,  // 控制器溫度
    "battTemp": 65,        // 電池溫度
    "battState": "discharging" // charging|discharging
  }
}
```

### ❌ 通用錯誤格式

所有 API 錯誤回應遵循統一格式：

```json
{
  "message": "錯誤描述",
  "code": "ERROR_CODE",
  "details": {
    "field": "額外錯誤資訊"
  }
}
```

#### HTTP 狀態碼說明
- **200**: 成功
- **201**: 建立成功
- **400**: 請求格式錯誤
- **401**: 未授權（需要登入）
- **403**: 權限不足
- **404**: 資源不存在
- **409**: 資源衝突（如車輛已被租借）
- **422**: 資料驗證失敗
- **500**: 伺服器內部錯誤
- **503**: 服務暫時無法使用（如車輛離線）

## 📋 完整資料結構定義

### 🚴 車輛相關型別

```typescript
// 車輛物件結構
interface Vehicle {
  id: string                    // 車輛 ID
  name?: string                 // 車輛名稱
  lat?: number                  // 緯度
  lon?: number                  // 經度
  speedKph?: number            // 速度 (km/h)
  batteryPct?: number          // 電量百分比 (舊欄位)
  batteryLevel?: number        // 電池電量百分比
  signal?: '良好' | '中等' | '弱' // 信號強度
  status?: VehicleStatus       // 車輛狀態
  lastSeen?: string            // 最後更新時間 (ISO)
  
  // 兼容舊欄位
  siteId?: string              // 所屬站點 ID
  model?: string               // 車輛型號
  location?: {                 // 位置物件
    lat: number
    lng: number
  }
  brand?: 'huali' | 'shunqi'   // 品牌
  
  // 8欄位表格使用欄位
  soc_pct?: number            // SoC 電量百分比
  motor?: string              // Motor 編號
  battery?: string            // Battery 編號
  controller?: string         // Controller 編號
  port?: number               // Port 編號
  mqtt_ok?: boolean           // MQTT 連線狀態
  registeredUser?: string     // 使用者資訊（使用中時）
  
  // 元件狀態
  motorStatus?: ComponentStatus
  batteryStatus?: ComponentStatus
  controllerStatus?: ComponentStatus
  portStatus?: ComponentStatus
  mqttStatus?: 'online' | 'offline'
  
  // 電池健康度相關
  soh?: number                // 電池健康度 (0-100)
  predictedRangeKm?: number   // 預估續航里程
  chargeCycles?: number       // 充放電循環次數
  predictedReplaceAt?: string // 預估更換時間
  
  // 電池趨勢資料 (過去 7 天)
  batteryTrend?: Array<{
    t: number                  // Unix timestamp
    v: number                  // 電池電量值
  }>
  
  lastUpdate?: string         // 最後更新時間
  createdAt?: string          // 建立時間
}

// 車輛狀態類型
type VehicleStatus = 
  | '可租借' | '使用中' | '離線' | '維修' | '低電量'  // 中文狀態
  | 'available' | 'in-use' | 'rented' | 'maintenance' | 'charging' | 'low-battery'  // 英文狀態

// 元件狀態類型
type ComponentStatus = 'normal' | 'warning' | 'error' | 'offline'
```

### 🚨 警報相關型別

```typescript
// 警報物件
interface Alert {
  id: string                   // 警報 ID
  siteId: string               // 站點 ID
  vehicleId?: string           // 車輛 ID (可選)
  severity: AlertSeverity      // 嚴重程度
  type: string                 // 警報類型
  message: string              // 警報訊息
  description?: string         // 詳細描述
  resolved: boolean            // 是否已解決
  createdAt: string           // 建立時間 (ISO)
  resolvedAt?: string         // 解決時間 (ISO)
}

// 警報嚴重程度
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
```

### 🏢 站點相關型別

```typescript
// 站點物件
interface Site {
  id: string                   // 站點 ID
  name: string                 // 站點名稱
  region: 'hualien' | 'taitung' // 區域
  location: {                  // 地理位置
    lat: number
    lng: number
  }
  status: 'active' | 'maintenance' | 'offline' // 站點狀態
  brand: 'huali' | 'shunqi'    // 營運品牌
  vehicleCount: number         // 總車輛數
  availableCount: number       // 可用車輛數
  availableSpots?: number      // 可停車位數
  batteryLevels: {             // 電池電量分佈
    high: number               // >70% 的車輛數
    medium: number             // 30-70% 的車輛數
    low: number                // <30% 的車輛數
  }
  createdAt: string           // 建立時間 (ISO)
  updatedAt: string           // 更新時間 (ISO)
}
```

### 👤 使用者相關型別

```typescript
// 使用者物件 (認證用)
interface AuthUser {
  id: string                   // 使用者 ID
  name: string                 // 姓名
  email: string                // Email
  roleId: 'admin' | 'manager' | 'user' // 角色 ID
  phone?: string               // 電話
  avatarUrl?: string           // 頭像 URL
}

// 使用者物件 (管理用)
interface User {
  id: string                   // 使用者 ID
  email: string                // Email
  fullName: string             // 全名
  roleId: string               // 角色 ID
  active: boolean              // 啟用狀態
  createdAt: string           // 建立時間 (ISO)
  lastLogin: string           // 最後登入時間 (ISO)
}

// 角色物件
interface Role {
  id: string                   // 角色 ID
  name: string                 // 角色名稱
  desc: string                 // 描述
  scopes: string[]             // 權限範圍
}
```

### 🔋 電池相關型別

```typescript
// 電池統計
interface BatteryStat {
  id: string                   // 電池 ID
  vehicleId: string            // 車輛 ID
  soc: number                  // 電量 (0-100)
  temp: number                 // 溫度 (°C)
  health?: number              // 健康度 (0-100)
  ts: string                   // 時間戳 (ISO)
}

// 電池風險評估
interface BatteryRisk {
  id: string                   // 車輛 ID
  health: number               // 健康度 (0-100)
  faultP: number               // 故障機率 (0-1)
}
```

### 🧠 ML 預測相關型別

```typescript
// 路線策略預測結果
interface StrategyResult {
  polyline: Array<{            // 建議路線座標點
    lat: number
    lon: number
  }>
  estTime: string              // 預計行程時間
  estEnergy: string            // 預計能耗
}

// 碳排放預測結果
interface CarbonResult {
  saved: number                // 減碳量 (kg)
}

// 電力消耗預測結果
interface PowerResult {
  kWh: number                  // 預估耗電量
  nextCharge: string           // 下次充電建議
}
```

### 🚲 租借相關型別

```typescript
// 租借記錄
interface Rental {
  rentalId: string             // 租借 ID
  bikeId: string               // 車輛 ID
  userName: string             // 使用者姓名 (2-30字)
  phone: string                // 電話 (台灣格式)
  idLast4: string              // 身分證末四碼
  state: 'reserving' | 'unlocking' | 'in_use' // 租借狀態
  startedAt: string           // 開始時間 (ISO)
}

// 建立租借表單
interface CreateRentalForm {
  bikeId: string               // 車輛 ID
  userName: string             // 使用者姓名 (2-30字)
  phone: string                // 電話 (符合台灣格式)
  idLast4: string              // 身分證末四碼 (4位數字)
}
```

### 🔄 歸還相關型別

```typescript
// 歸還記錄
interface ReturnRecord {
  id: string                   // 歸還 ID
  vehicleId: string            // 車輛 ID
  siteId: string               // 歸還站點 ID
  fromSiteId?: string          // 原站點 ID
  odometer: number             // 里程表讀數 (≥0)
  battery: number              // 電池電量 (0-100)
  issues?: string              // 問題描述
  photos?: string[]            // 照片 URL 陣列
  by?: string                  // 操作人員 ID
  createdAt: string           // 歸還時間 (ISO)
}

// 歸還表單
interface ReturnPayload {
  vehicleId: string            // 車輛 ID
  siteId: string               // 歸還站點 ID
  odometer: number             // 里程表讀數 (≥0)
  battery: number              // 電池電量 (0-100)
  issues?: string              // 問題描述
  photos?: string[]            // 照片 URL 陣列
}
```

### 📊 統計相關型別

```typescript
// 總覽 KPI
interface SummaryKpis {
  online: number               // 在線車輛數
  offline: number              // 離線車輛數
  distance: number             // 總行駛距離 (km)
  carbon: number               // 減碳量 (kg)
}
```

## 🐳 Docker 部署

### 使用 Docker Compose
```bash
# 建置並啟動容器
docker compose up --build -d

# 瀏覽器開啟 http://localhost:8081
```

### 手動 Docker 指令
```bash
# 建置映像檔
docker build -t penguin-dashboard .

# 執行容器
docker run -d \
  -p 8080:80 \
  --name penguin-dashboard \
  --restart unless-stopped \
  penguin-dashboard

# 瀏覽器開啟 http://localhost:8080
```

### Nginx 設定
容器內建 Nginx 設定已包含：
- 單頁應用 (SPA) 路由支援
- Gzip 壓縮
- 快取標頭設定
- 安全標頭配置

## 📊 專案統計

### 程式碼規模
- **Vue 組件**：45+ 個
- **TypeScript 檔案**：100+ 個
- **程式碼行數**：15,000+ 行
- **測試資料**：42 輛車輛，5 個站點

### 功能覆蓋
- **頁面數量**：8 個主要頁面
- **API 端點**：30+ 個
- **Mock 處理器**：完整的 MSW 設定
- **響應式支援**：桌面、平板、手機

## 🔧 開發工作流

### Git 分支策略
```bash
main          # 主分支（生產環境）
develop       # 開發分支
feature/*     # 功能分支
hotfix/*      # 緊急修復分支
```

### 提交訊息規範
```bash
feat: 新功能
fix: 錯誤修復
docs: 文檔更新
style: 樣式調整
refactor: 重構
test: 測試相關
chore: 建置或輔助工具變動
```

### 開發指引
1. 從 `develop` 建立 `feature/` 分支
2. 開發完成後提交 Pull Request
3. Code Review 通過後合併至 `develop`
4. 定期從 `develop` 合併至 `main`

## 🧪 測試策略

### 手動測試檢查清單
- [ ] 登入流程與權限控制
- [ ] 各頁面載入與渲染正確
- [ ] 地圖互動與車輛標記
- [ ] 表格篩選與排序功能
- [ ] 響應式布局適配
- [ ] 統計資料準確性
- [ ] 模態框操作流程

### 瀏覽器相容性
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🚀 效能優化

### 已實施優化
- **代碼分割**：路由層級的懒加載
- **樹搖優化**：移除未使用的代碼
- **圖片優化**：適當的格式與壓縮
- **快取策略**：靜態資源長期快取
- **CDN 加速**：圖標與字體 CDN 載入

### 效能指標
- **首次載入**：< 3秒（3G 網路）
- **Lighthouse 分數**：90+ (Performance)
- **Bundle 大小**：< 2MB (gzipped)

## 🐛 故障排除

### 常見問題

**Q: 地圖無法顯示**
```bash
# 檢查網路連線
curl -I https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/0/0/0

# 檢查環境變數
echo $VITE_EMAP_LAYER
```

**Q: Mock 資料未載入**
```bash
# 檢查環境變數
echo $VITE_SEED_MOCK  # 應該為 1

# 檢查瀏覽器控制台
# 應該看到 "[MSW] ✅ mock worker ready"
```

**Q: 建置失敗**
```bash
# 清理快取
rm -rf node_modules/.vite
rm -rf dist

# 重新安裝依賴
pnpm install

# 檢查 TypeScript 錯誤
pnpm type-check
```

## 📚 學習資源

### Vue 3 生態系
- [Vue 3 官方文檔](https://vuejs.org/)
- [Pinia 狀態管理](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)

### 地圖相關
- [MapLibre GL JS](https://maplibre.org/)
- [NLSC WMTS 服務](https://maps.nlsc.gov.tw/)

### 設計系統
- [UnoCSS 文檔](https://unocss.dev/)
- [Headless UI](https://headlessui.dev/)

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 貢獻流程
1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

### 程式碼規範
- 遵循 TypeScript 最佳實踐
- 使用有意義的變數與函數名稱
- 適當的註解與文檔
- 保持一致的代碼風格

## 📄 授權條款

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 致謝

- **內政部國土測繪中心（NLSC）**：提供台灣地圖圖資服務
- **Vue.js 團隊**：優秀的前端框架
- **MapLibre 社群**：開源地圖解決方案
- **UnoCSS 團隊**：高效的 CSS 引擎

## 📞 聯絡資訊

如有問題或建議，歡迎透過以下方式聯絡：

- **GitHub Issues**：[提交問題](https://github.com/osdp25w/penguin/issues)
- **Email**：請透過 GitHub Profile 聯絡
- **討論區**：[GitHub Discussions](https://github.com/osdp25w/penguin/discussions)

---

**Happy Coding! 🚴‍♂️💨**

*本專案致力於推進台灣智慧交通與永續移動的發展。*