# src/components/map/

MapLibre GL JS 地圖元件。

- `MapLibreMap.vue`：包裝核心地圖初始化與 WMTS 圖層設定（含 EMAP/EMAP2/PHOTO2）。
- `BikeMap.vue`：結合站點與車輛資料的應用層，負責 marker、cluster、popup 與 tooltip。

特性：
- 根據 `VITE_MAP_PROVIDER` 與 `VITE_EMAP_*` 環境變數載入圖磚。
- 透過 Pinia stores (`sites`, `vehicles`) 取得資料，支援篩選與點擊事件。
- Mobile/桌面雙模式下調整面板與互動。

> 若整合其他地圖供應商，建議新增 provider adapter 並更新此 README。
