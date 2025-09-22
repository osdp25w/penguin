# public/models/

前端使用的 ONNX 模型與對應 metadata。`src/ml/onnx.ts` 會以動態載入方式讀取此目錄下的檔案。

## 檔案命名
- `<name>.onnx`：模型本體。
- `<name>_metadata.json`：對應模型的描述（特徵名稱、輸入範圍、資料來源等）。

## 目前內容
- `battery_capacity.onnx`：RandomForestRegressor，預測單次放電容量 (Ah)。
- `battery_capacity_metadata.json`：記錄特徵欄位（`soc`, `voltage`, `temperature`）與訓練資料統計。

## 更新流程
1. 以 `scripts/export_battery_model.py` 或其他內部工具產出新的 ONNX。
2. 覆蓋此目錄下的檔案並更新 metadata。
3. 重新建置前端或於開發模式重新載入頁面。

> 若部署至 CDN，請記得設定正確的 Cache-Control 與版本號，以避免瀏覽器使用舊模型。
