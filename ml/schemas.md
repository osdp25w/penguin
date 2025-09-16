Model IO Schemas (browser inference)

Common telemetry mapping
- From MQTT: LA (lat 1e-6), LG (lon 1e-6), VS (km/h), SO (%), PT (0.01 Nm), CA (0.025 rpm), AL (assist 0–4), CT (°C, 2000=NA), MV (0.1V)
- Derived: voltage = MV/10, cadenceRPM = CA*0.025, torqueNm = PT/100

1) strategy.onnx
- Input tensor name: `input`  shape [1,7] float32
  [ distanceKm, soc, speedKph, terrain01, wind01, preference01, assist ]
- Output tensors: `time` [1,1] (minutes), `energy` [1,1] (kWh)

2) carbon.onnx
- Input: `input` [1,2] → [ distanceKm, energyPerKmKWh ]
- Output: `saved` [1,1] → kg CO2 saved

3) power.onnx
- Input: `input` [1,4] → [ speedKph, tempC, wind[-1..1], assist ]
- Output: `kwh` [1,1], (optional) `next` [1,1]

4) battery_risk.onnx
- Input: `input` [1,5] → [ soc, voltage, ctrlTemp, cadenceRPM, torqueNm ]
- Output: `prob` [1,1] → failure probability in 0..1

