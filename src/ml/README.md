# src/ml/

瀏覽器端機器學習推論模組。

- `config.ts`：模型檔案名稱與載入路徑設定。
- `featurizer.ts`：將業務資料（SoC、騎乘里程、溫度等）轉換為模型輸入向量。
- `onnx.ts`：封裝 ONNX Runtime Web 載入與 session 快取。
- `runners.ts`：提供高階 API，例如 `predictBatteryCapacity`、`predictRideRange`。會在模型缺失時 fallback 至啟發式估算。

此模組搭配 `public/models/` 內的 ONNX 檔案。若需新增模型：
1. 在 `config.ts` 宣告模型名稱與路徑。
2. 於 `runners.ts` 建立對應的推論函式。
3. 更新 `ml/README.md` 與 `public/models/README.md`。

> 推論為非同步操作，請在呼叫端妥善處理 loading 與錯誤狀態。
