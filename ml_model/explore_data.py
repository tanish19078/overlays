import pandas as pd
import json
import os

files = [
    "Evaluating Efficient Use of Waste Heat Energy and Decarbonisation Potentials Using the EMB3RS Platform UK Energy-Intensive Industries.xlsx",
    "Market_integration_analysis_of_heat_recovery_under_the_EMB3Rs_platform_An_industrial_park_case_in_Greece_simulation 361.xlsx",
    "Platform_simulation_Defaults.xlsx",
    "Techno-economic optimization of the industrial excess heat recovery for an industrial park with high spatial and temporal resolution.xlsx",
    "Training_material_simulations1,2,3.xlsx"
]

all_sheets = {}
for file in files:
    try:
        xls = pd.ExcelFile(file)
        all_sheets[file] = xls.sheet_names
    except Exception as e:
        pass

print(json.dumps(all_sheets, indent=2))
