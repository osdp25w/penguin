# src/components/filters/

車輛與軌跡篩選面板。

- `VehicleFilter.vue`：提供狀態、站點、SoC/SoH 範圍、MQTT 狀態等篩選。
- `VehicleTraceFilter.vue`：查詢車輛歷史軌跡與時間區間。

特性：
- 與 Pinia `vehicles`/`sites` store 緊密整合，透過 emits/事件更新查詢參數。
- 使用 `@vueuse` / UnoCSS 建立彈性布局，支援桌面與行動裝置。

> 若新增篩選條件，需同步更新 `src/stores/vehicles.ts` 與對應 API 查詢參數。
