export const MODEL_PATHS = {
  strategy: '/models/strategy.onnx',
  carbon: '/models/carbon.onnx',
  power: '/models/power.onnx',
  battery: '/models/battery_risk.onnx',
  // Optional models you may add
  range: '/models/range.onnx',
  soh: '/models/soh_rf.onnx',
  anomaly: '/models/iforest.onnx'
}

// Default constants for simple heuristic fallbacks
export const DEFAULTS = {
  baseSpeedKph: 18,         // comfortable baseline on flat
  energyPerKmKWh: 0.012,    // ebike consumption per km
  carCO2PerKm: 0.2,         // kg CO2 per km for car
  ebikeCO2PerKWh: 0.05      // kg CO2 per kWh for electricity
}
