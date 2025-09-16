ML models overview and deployment plan

Goals
- Riding strategy recommender (comfort vs. challenge)
- Carbon reduction estimator (per ride + monthly aggregates)
- Rider power/energy use predictor
- Battery fault risk predictor

Runtime
- Inference runs in browser with ONNX Runtime Web (WASM). Models are loaded from `/public/models/*.onnx`.
- If a model is unavailable, the UI shows heuristic results to keep the UX responsive.

Training (offline)
- Data sources: MQTT telemetry (GPS/time/speed/SOC/volt/temp), user prefs, terrain (DEM), weather API.
- Nightly batches: produce training tables with aligned features and labels.
- Export ONNX with scikit-learn/XGBoost/LightGBM (skl2onnx/onnxmltools) or TF → ONNX.

File layout
- `public/models/`    → ONNX files for web inference (see README there)
- `src/ml/`           → `featurizer.ts`, `runners.ts` (ONNX + fallback), `onnx.ts` loader
- `ml/schemas.md`     → IO schemas for each model

Deployment
- Copy new ONNX files to `public/models`, rebuild, deploy. The app hot-loads from `/models/*.onnx`.

