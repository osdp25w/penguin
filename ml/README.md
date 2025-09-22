# ml/

資料科學與模型產製資源，專注於電池老化、騎乘行為與減碳預估。

## 目標模型
- **Battery capacity regression**：由 `scripts/export_battery_model.py` 產生，預測放電容量與 SOH。
- **Range & energy predictor**：規劃中，依賴行車路徑、坡度與天氣資料。
- **Rider segmentation / recommender**：根據騎乘偏好推薦模式。

## 結構
- `schemas.md`：定義各模型的 ONNX I/O schema 與特徵欄位。
- `README.md`（本檔）：流程總覽。
- (根目錄 `scripts/`) `export_battery_model.py`：訓練 RandomForestRegressor 並導出 ONNX。
- 產生的模型會輸出到 `public/models/`，由前端透過 `src/ml/runners.ts` 讀取。

## 訓練流程
1. 準備資料集，例如 `../battery_aging/discharge.csv`（NASA battery aging dataset）。
2. 執行 `python scripts/export_battery_model.py` 產出 `battery_capacity.onnx` 與 metadata。
3. 將結果佈署到 CDN 或 `public/models/` 後重新建置前端。

## 推論端
- 前端主程式位於 `src/ml/`：`featurizer.ts`、`onnx.ts`、`runners.ts`。
- 推論在瀏覽器使用 ONNX Runtime Web (WASM)。若模型缺失，會 fallback 至啟發式估算，確保 UI 繼續運作。

> 如需擴充新模型，請同步更新 `schemas.md` 以及 `public/models/README.md`，確保前後端一致。
