Place exported ONNX models here for in‑browser inference (ONNX Runtime Web).

Expected filenames (default):
- strategy.onnx      → inputs: float32[1,7]  (distanceKm, soc, speed, terrain01, wind01, pref01, assist)
                       outputs: time float32[1,1], energy float32[1,1]
- carbon.onnx        → inputs: float32[1,2]  (distanceKm, energyPerKmKWh)
                       outputs: saved float32[1,1]
- power.onnx         → inputs: float32[1,4]  (speedKph, tempC, wind[-1..1], assist)
                       outputs: kwh float32[1,1], next int32|string index (optional)
- battery_risk.onnx  → inputs: float32[1,5]  (soc, voltage, ctrlTemp, cadence, torque)
                       outputs: prob float32[1,1]

If a model is missing or ONNX runtime fails to load, the app gracefully falls back to heuristic results.

