/**
 * OverLays — Temperature Compatibility Scoring
 * Checks if source temperature minus thermal losses still meets sink requirements
 */

// Thermal loss rate: ~2°C per km for well-insulated district heating pipes
const THERMAL_LOSS_PER_KM = 2.0;

// Beyond this surplus, diminishing returns
const MAX_USEFUL_SURPLUS = 50;

/**
 * Compute temperature compatibility score based on thermodynamic heat loss (Fourier's Law)
 * @param {object} source - Source facility
 * @param {object} sink - Sink facility
 * @param {number} pipeLengthKm - Actual estimated pipe distance in km
 * @returns {{ score: number, effective_temp: number, thermal_loss: number }}
 */
function temperatureScore(source, sink, pipeLengthKm) {
  // Thermodynamic Constants for District Heating
  const SPECIFIC_HEAT_WATER_KJ_KG_K = 4.184;
  const TYPICAL_DELTA_T_C = 40; // Assume 40C drop across the heat exchanger for mass flow calc
  const PIPE_U_VALUE_W_MK = 0.3; // Typical pre-insulated twin pipe thermal transmittance
  const AMBIENT_SOIL_TEMP_C = 10;
  
  // 1. Calculate required mass flow rate (kg/s) to achieve source capacity MW
  // Equation: Q (kW) = m_dot * Cp * delta_T => m_dot = (MW * 1000) / (Cp * delta_T)
  const massFlowRate = (source.capacity_mw * 1000) / (SPECIFIC_HEAT_WATER_KJ_KG_K * TYPICAL_DELTA_T_C);
  
  // 2. Calculate actual thermal loss using Fourier's Heat Transfer simplified for buried pipes
  // delta_T_loss = (U * L * (T_avg - T_soil)) / (m_dot * Cp)
  // where L is length in meters.
  const pipeLengthMeters = pipeLengthKm * 1000;
  
  const thermalLossC = massFlowRate > 0 ? 
    (PIPE_U_VALUE_W_MK * pipeLengthMeters * (source.temp_avg_c - AMBIENT_SOIL_TEMP_C)) / 
    (massFlowRate * SPECIFIC_HEAT_WATER_KJ_KG_K * 1000) 
    : 0;

  const effectiveTemp = source.temp_avg_c - thermalLossC;

  // If effective temperature is below sink's minimum requirement → incompatible
  if (effectiveTemp < sink.temp_min_c) {
    return {
      score: 0,
      effective_temp: parseFloat(effectiveTemp.toFixed(1)),
      thermal_loss: parseFloat(thermalLossC.toFixed(1)),
    };
  }

  // Higher surplus = better (more safety margin)
  const surplus = effectiveTemp - sink.temp_min_c;
  const score = Math.min(100, (surplus / MAX_USEFUL_SURPLUS) * 100);

  return {
    score: Math.round(score),
    effective_temp: parseFloat(effectiveTemp.toFixed(1)),
    thermal_loss: parseFloat(thermalLossC.toFixed(1)),
  };
}

/**
 * Check if source grade is compatible with sink grade
 * HIGH → can serve LOW, MID, HIGH
 * MID  → can serve LOW, MID
 * LOW  → can serve LOW only
 */
function gradeCompatible(sourceGrade, sinkGrade) {
  const gradeRank = { LOW: 1, MID: 2, HIGH: 3 };
  return (gradeRank[sourceGrade] || 0) >= (gradeRank[sinkGrade] || 0);
}

module.exports = { temperatureScore, gradeCompatible };
