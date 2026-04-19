import sys
import json
import joblib
import pandas as pd
import os

try:
    # We read the JSON payload passed from the Node.js backend
    input_data = sys.stdin.read()
    payload = json.loads(input_data)
    
    # Needs to match the columns we trained on exactly
    features = {
        'source_capacity_mw': payload.get('source_capacity_mw', 10.0),
        'sink_capacity_mw': payload.get('sink_capacity_mw', 10.0),
        'source_availability': payload.get('source_availability', 0.8),
        'distance_km': payload.get('distance_km', 5.0),
        'thermal_loss_pct': payload.get('thermal_loss_pct', 5.0),
        'seasonal_score': payload.get('seasonal_score', 80.0),
        'has_storage': int(payload.get('has_storage', False)),
        'sink_cost_mwh': payload.get('sink_cost_mwh', 50.0)
    }

    df = pd.DataFrame([features])
    
    # Assuming thermolink_model.pkl is downloaded to this folder!
    model_path = os.path.join(os.path.dirname(__file__), 'thermolink_model.pkl')
    model = joblib.load(model_path)
    
    prediction = model.predict(df)[0]
    
    # Return JSON to Node.js
    print(json.dumps({"success": True, "payback_years": float(prediction)}))
    
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)
