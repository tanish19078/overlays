/**
 * OverLays — Economic Viability Scoring
 * Estimates ROI, payback period, annual savings, and CO₂ reduction
 */

const { execSync } = require('child_process');
const path = require('path');

// Cost constants (approximate for India)
const PIPE_COST_PER_METER_USD = 800;       // Insulated district heating pipe
const HEAT_EXCHANGER_COST_USD = 150000;    // Flat estimate per connection
const THERMAL_STORAGE_COST_USD = 200000;   // If storage is recommended
const CO2_EMISSION_FACTOR = 0.18;          // tonnes CO₂ per MWh of displaced gas heating
const HOURS_PER_YEAR = 8760;

// ── ML Prediction Cache ───────────────────────────────────
// Avoids spawning 300+ Python subprocesses on bulk matching.
// The cache key is a hash of the input features.
const _mlCache = new Map();
const ML_CACHE_MAX = 500;

function mlCacheKey(payload) {
  return `${payload.source_capacity_mw.toFixed(1)}_${payload.sink_capacity_mw.toFixed(1)}_${payload.distance_km.toFixed(2)}_${payload.seasonal_score.toFixed(0)}`;
}

function mlPredict(payload) {
  const key = mlCacheKey(payload);
  if (_mlCache.has(key)) return _mlCache.get(key);

  try {
    const pyScript = path.join(__dirname, '../../ml_model/predict.py');
    const output = execSync(`python "${pyScript}"`, {
      input: JSON.stringify(payload),
      encoding: 'utf-8',
      timeout: 10000, // 10s hard timeout per prediction
    });
    const result = JSON.parse(output.trim());

    if (result.success) {
      // Evict oldest entry if cache is full
      if (_mlCache.size >= ML_CACHE_MAX) {
        const firstKey = _mlCache.keys().next().value;
        _mlCache.delete(firstKey);
      }
      _mlCache.set(key, result.payback_years);
      return result.payback_years;
    }
  } catch (_) {
    // Silently fall through to manual calc
  }
  return null;
}

/**
 * Compute economic viability score and ROI projections
 * @param {object} source - Source facility
 * @param {object} sink - Sink facility
 * @param {number} distanceKm - Pipe distance
 * @param {number} thermalLossPct - Thermal loss percentage over distance
 * @param {number} seasonalScore - Seasonal overlap score (0-100)
 * @param {boolean} storageRecommended - Whether thermal storage is needed
 * @returns {object} Economic analysis
 */
function economicScore(source, sink, distanceKm, thermalLossPct, seasonalScore, storageRecommended = false) {
  // Calculate transferable thermal power (limited by smaller of supply/demand)
  const effectiveSupply = source.capacity_mw * source.availability * (1 - thermalLossPct / 100);
  const effectiveDemand = sink.capacity_mw * (seasonalScore / 100);
  const transferMW = Math.min(effectiveSupply, effectiveDemand);

  // Infrastructure cost estimation
  const pipeCost = distanceKm * 1000 * PIPE_COST_PER_METER_USD;
  const exchangerCost = HEAT_EXCHANGER_COST_USD;
  const storageCost = storageRecommended ? THERMAL_STORAGE_COST_USD : 0;
  const totalInvestment = pipeCost + exchangerCost + storageCost;

  // Annual savings from displaced conventional heating
  const annualSavingsMWh = transferMW * HOURS_PER_YEAR * (seasonalScore / 100);
  const heatingCostPerMWh = sink.heating_cost_per_mwh || 50;
  const energySavingsUSD = annualSavingsMWh * heatingCostPerMWh;

  // Modern corporate finance: Carbon Credit Monetization
  const co2ReductionTonnes = annualSavingsMWh * CO2_EMISSION_FACTOR;
  const CARBON_CREDIT_PRICE_USD = 50; // Traded carbon credit offset pricing
  const carbonRevenueUSD = co2ReductionTonnes * CARBON_CREDIT_PRICE_USD;
  
  const totalAnnualSavingsUSD = energySavingsUSD + carbonRevenueUSD;

  // Payback period — try ML model first (cached), fall back to manual calc
  const mlPayload = {
    source_capacity_mw: source.capacity_mw,
    sink_capacity_mw: sink.capacity_mw,
    source_availability: source.availability,
    distance_km: distanceKm,
    thermal_loss_pct: thermalLossPct,
    seasonal_score: seasonalScore,
    has_storage: storageRecommended ? 1 : 0,
    sink_cost_mwh: heatingCostPerMWh,
  };

  let paybackYears = Infinity;
  const mlResult = mlPredict(mlPayload);
  if (mlResult !== null) {
    // Adjust ML payback for carbon credit revenue
    paybackYears = mlResult * (energySavingsUSD / Math.max(totalAnnualSavingsUSD, 1));
  } else {
    paybackYears = totalAnnualSavingsUSD > 0 ? totalInvestment / totalAnnualSavingsUSD : Infinity;
  }

  // Calculate strict Net Present Value (NPV) over a 20-year project lifetime with 8% discount rate
  const DISCOUNT_RATE = 0.08;
  const PROJECT_LIFETIME_YRS = 20;
  let npvUSD = -totalInvestment;
  for (let t = 1; t <= PROJECT_LIFETIME_YRS; t++) {
    npvUSD += totalAnnualSavingsUSD / Math.pow(1 + DISCOUNT_RATE, t);
  }

  // If NPV is strongly negative, it's not economically viable
  // Score merges NPV viability and Payback velocity.
  // Optimal payback = < 2 years. Optimal NPV > 3x total investment
  let score = 0;
  
  if (npvUSD <= 0) {
    score = 0; // Loss making operation
  } else {
    // Payback Score component (0 to 50 points)
    let paybackScore = 0;
    if (paybackYears <= 2) paybackScore = 50;
    else if (paybackYears >= 12) paybackScore = 0;
    else paybackScore = ((12 - paybackYears) / 10) * 50;

    // NPV ROI component (0 to 50 points)
    // Ratio of NPV to Initial Investment
    const roiRatio = npvUSD / totalInvestment; 
    let npvScore = Math.min(50, (roiRatio / 3.0) * 50); // Caps at 300% ROI yielding 50 points

    score = paybackScore + npvScore;
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    transfer_mw: parseFloat(transferMW.toFixed(2)),
    annual_savings_mwh: Math.round(annualSavingsMWh),
    annual_savings_usd: Math.round(totalAnnualSavingsUSD),
    co2_reduction_tonnes: Math.round(co2ReductionTonnes),
    payback_years: parseFloat(Math.min(paybackYears, 99).toFixed(1)),
    total_investment_usd: Math.round(totalInvestment),
    infrastructure_breakdown: {
      pipe_cost: Math.round(pipeCost),
      heat_exchanger_cost: exchangerCost,
      storage_cost: storageCost,
    },
  };
}

/**
 * Compute infrastructure readiness score
 * Based on existing equipment and space availability
 */
function infrastructureScore(source, sink) {
  let score = 0;

  // Source has heat exchanger: +25
  if (source.has_heat_exchanger) score += 25;
  // Sink has heat exchanger: +25
  if (sink.has_heat_exchanger) score += 25;
  // Source pipe-ready: +15
  if (source.pipe_ready) score += 15;
  // Sink pipe-ready: +15
  if (sink.pipe_ready) score += 15;
  // Space availability bonus (both have > 100m²): +10 each
  if ((source.available_space_m2 || 0) >= 100) score += 10;
  if ((sink.available_space_m2 || 0) >= 100) score += 10;

  return { score: Math.min(100, score) };
}

module.exports = { economicScore, infrastructureScore };
