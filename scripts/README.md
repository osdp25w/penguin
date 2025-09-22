# scripts/

資料科學與輔助腳本。

## export_battery_model.py
- 讀取 `../battery_aging/discharge.csv`（NASA battery aging dataset）。
- 建立 features（soc、voltage、temperature）與 target（capacity）。
- 訓練 `RandomForestRegressor`，輸出 ONNX (`public/models/battery_capacity.onnx`) 與 metadata JSON。

使用方式：
```bash
python scripts/export_battery_model.py
```

執行前請確認：
- 已安裝相依套件：`pandas`, `scikit-learn`, `skl2onnx`。
- `battery_aging/discharge.csv` 存在且欄位與腳本要求相符。

> 若未來新增其他腳本，請於此 README 紀錄用途與執行需求。
