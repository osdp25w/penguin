# src/components/charts/

ECharts-based 視覺化元件，提供儀表板與趨勢分析所需的圖表。

- `SocTrend.vue`：顯示 SoC 平均值趨勢，支援不同時間粒度。
- `CarbonBar.vue`：月/週碳減量長條圖。

共通特性：
- 透過 `vue-echarts` 將 ECharts 以 Vue 元件包裝。
- 接收 `labels`、`values` 等 props，並透過 `watch` 動態更新。
- 內建 loading / empty state 判斷，搭配 `Card` 元件使用。

> 若新增圖表，請同步於此處紀錄資料需求與 props 格式。
