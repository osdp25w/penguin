"""Train battery ageing regression model (capacity) and export as ONNX."""

from pathlib import Path

import pandas as pd
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = Path('/Users/xutingwei/bike2')
DATA_PATH = BASE_DIR / 'battery_aging/discharge.csv'
OUTPUT_DIR = BASE_DIR / 'penguin/public/models'
OUTPUT_ONNX = OUTPUT_DIR / 'battery_capacity.onnx'
OUTPUT_META = OUTPUT_DIR / 'battery_capacity_metadata.json'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

RATED_CAPACITY = 2.0  # Ah, NASA battery dataset nominal value
print('[battery] loading dataset:', DATA_PATH)
df = pd.read_csv(DATA_PATH)
required = {'Battery', 'id_cycle', 'Time', 'Voltage_measured', 'Temperature_measured', 'Capacity'}
missing = required - set(df.columns)
if missing:
    raise ValueError(f'Missing columns in dataset: {missing}')

records = []
for (battery, cycle), group in df.groupby(['Battery', 'id_cycle']):
    group = group.sort_values('Time')
    soc = group['Capacity'].max() / RATED_CAPACITY
    voltage = group['Voltage_measured'].min()  # end-of-discharge voltage
    temp = group['Temperature_measured'].max()
    records.append({
        'battery': battery,
        'cycle': int(cycle),
        'soc': float(max(0.0, min(1.2, soc))),
        'voltage': float(voltage),
        'temperature': float(temp),
        'capacity': float(group['Capacity'].max()),
    })

features = pd.DataFrame(records).sort_values(['battery', 'cycle']).reset_index(drop=True)
print('[battery] feature frame shape:', features.shape)

X = features[['soc', 'voltage', 'temperature']].values
y = features['capacity'].values

model = RandomForestRegressor(
    n_estimators=250,
    random_state=42,
    max_depth=None,
    n_jobs=-1,
)
print('[battery] training model...')
model.fit(X, y)
print('[battery] training R^2:', model.score(X, y))

initial_type = [('input', FloatTensorType([None, X.shape[1]]))]
print('[battery] exporting ONNX...')
onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=15)
OUTPUT_ONNX.write_bytes(onnx_model.SerializeToString())

metadata = {
    'features': ['soc', 'voltage', 'temperature'],
    'target': 'capacity',
    'rated_capacity': RATED_CAPACITY,
    'capacity_range': [float(features['capacity'].min()), float(features['capacity'].max())],
    'trained_samples': len(features),
}
OUTPUT_META.write_text(pd.Series(metadata).to_json(), encoding='utf-8')
print('[battery] wrote ONNX to', OUTPUT_ONNX)
print('[battery] wrote metadata to', OUTPUT_META)
