import pandas as pd
import numpy as np
import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

def economic_score_logic(source_cap, sink_cap, source_avail, distance_km, thermal_loss_pct, seasonal_score, has_storage, sink_cost_mwh):
    # This logic mirrors economic.js to create a label (Payback Years)
    effective_supply = source_cap * source_avail * (1 - thermal_loss_pct / 100)
    effective_demand = sink_cap * (seasonal_score / 100)
    transfer_mw = min(effective_supply, effective_demand)
    
    pipe_cost = distance_km * 1000 * 800
    exchanger_cost = 150000
    storage_cost = 200000 if has_storage else 0
    total_investment = pipe_cost + exchanger_cost + storage_cost
    
    annual_savings_mwh = transfer_mw * 8760 * (seasonal_score / 100)
    annual_savings_usd = annual_savings_mwh * sink_cost_mwh
    
    if annual_savings_usd > 0:
        payback_years = total_investment / annual_savings_usd
    else:
        payback_years = 99.0
        
    # Cap payback at 99 years to prevent infinity
    return min(payback_years, 99.0)

print("Synthesizing dataset for OverLays using EMB3Rs parameters...")

np.random.seed(42)
n_samples = 10000

# Generating features matching OverLays payload structure
data = {
    'source_capacity_mw': np.random.uniform(0.5, 50.0, n_samples),
    'sink_capacity_mw': np.random.uniform(0.5, 50.0, n_samples),
    'source_availability': np.random.uniform(0.5, 1.0, n_samples),
    'distance_km': np.random.uniform(0.1, 20.0, n_samples),
    'thermal_loss_pct': np.random.uniform(1.0, 15.0, n_samples),
    'seasonal_score': np.random.uniform(20.0, 100.0, n_samples),
    'has_storage': np.random.choice([0, 1], size=n_samples),
    'sink_cost_mwh': np.random.uniform(30.0, 120.0, n_samples)
}

df = pd.DataFrame(data)

# Compute target variable: Payback Years
# Adding a little noise to simulate real-world variance from hidden factors
df['payback_years'] = df.apply(lambda row: economic_score_logic(
    row['source_capacity_mw'], row['sink_capacity_mw'], row['source_availability'],
    row['distance_km'], row['thermal_loss_pct'], row['seasonal_score'],
    row['has_storage'], row['sink_cost_mwh']
) * np.random.uniform(0.9, 1.1), axis=1)

# We will focus on viable cases (payback < 20 years)
df = df[df['payback_years'] < 30].reset_index(drop=True)
print(f"Generated {len(df)} viable synthetic samples.")

# Prepare model
X = df.drop(columns=['payback_years'])
y = df['payback_years']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"Model Performance:")
print(f" - RMSE: {rmse:.2f} years")
print(f" - R2 Score: {r2:.3f}")

# Save the model
model_path = "overlays_model.pkl"
joblib.dump(model, model_path)
print(f"Model exported successfully to {model_path}")
