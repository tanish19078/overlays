/**
 * OverLays — Core Matching Engine
 * Orchestrates the multi-stage matching pipeline
 */

const { proximityScore } = require('./proximity');
const { temperatureScore, gradeCompatible } = require('./temperature');
const { seasonalOverlapScore, hourlyOverlapScore } = require('./seasonal');
const { economicScore, infrastructureScore } = require('./economic');

// Default scoring weights
const DEFAULT_WEIGHTS = {
  proximity: 0.25,
  temperature: 0.25,
  seasonal: 0.20,
  economic: 0.20,
  infrastructure: 0.10,
};

/**
 * Compute composite score from individual dimension scores
 */
function compositeScore(scores, weights = DEFAULT_WEIGHTS) {
  const total =
    scores.proximity * weights.proximity +
    scores.temperature * weights.temperature +
    scores.seasonal * weights.seasonal +
    scores.economic * weights.economic +
    scores.infrastructure * weights.infrastructure;
  return parseFloat(total.toFixed(1));
}

/**
 * Run the full matching pipeline for a given facility against all candidates
 * @param {object} facility - The facility to find matches for
 * @param {object[]} allFacilities - All registered facilities
 * @param {object} options - Matching options
 * @returns {object[]} Sorted array of match results
 */
function computeMatches(facility, allFacilities, options = {}) {
  const {
    maxDistanceKm = 10,
    minCompositeScore = 30,
    weights = DEFAULT_WEIGHTS,
    limit = 50,
  } = options;

  // Determine candidate pool (sources match with sinks, sinks match with sources)
  const candidateType = facility.type === 'SOURCE' ? 'SINK' : 'SOURCE';
  const candidates = allFacilities.filter((f) => f.type === candidateType && f.id !== facility.id);

  const matches = [];

  for (const candidate of candidates) {
    // Determine which is source and which is sink
    const source = facility.type === 'SOURCE' ? facility : candidate;
    const sink = facility.type === 'SINK' ? facility : candidate;

    // Stage 1: Proximity check
    const proxResult = proximityScore(source.location, sink.location, maxDistanceKm);
    if (proxResult.score === 0) continue; // Too far

    // Stage 2: Temperature compatibility
    if (!gradeCompatible(source.grade, sink.grade)) continue; // Grade mismatch

    const tempResult = temperatureScore(source, sink, proxResult.pipe_length_km);
    if (tempResult.score === 0) continue; // Temperature insufficient after losses

    // Stage 3: Seasonal overlap
    const seasonResult = seasonalOverlapScore(source.monthly_pattern, sink.monthly_pattern);
    const hourlyResult = hourlyOverlapScore(source.hourly_pattern, sink.hourly_pattern);

    // Combine monthly (70%) and hourly (30%) for overall seasonal score
    const combinedSeasonalScore = Math.round(seasonResult.score * 0.7 + hourlyResult.score * 0.3);

    // Stage 4: Economic viability
    const thermalLossPct = (tempResult.thermal_loss / source.temp_avg_c) * 100;
    const econResult = economicScore(
      source,
      sink,
      proxResult.pipe_length_km, // Use real pipe distance for pipe cost calculations
      thermalLossPct,
      combinedSeasonalScore,
      seasonResult.storage_recommended
    );

    // Stage 5: Infrastructure readiness
    const infraResult = infrastructureScore(source, sink);

    // Composite score
    const scores = {
      proximity: proxResult.score,
      temperature: tempResult.score,
      seasonal: combinedSeasonalScore,
      economic: econResult.score,
      infrastructure: infraResult.score,
    };

    const composite = compositeScore(scores, weights);

    if (composite < minCompositeScore) continue; // Below threshold

    matches.push({
      id: `match-${source.id}-${sink.id}`,
      source_id: source.id,
      sink_id: sink.id,
      source_name: source.name,
      sink_name: sink.name,
      source_category: source.category,
      sink_category: sink.category,
      scores,
      composite_score: composite,
      distance_km: proxResult.distance_km,
      effective_temp_c: tempResult.effective_temp,
      thermal_loss_c: tempResult.thermal_loss,
      thermal_loss_pct: parseFloat(thermalLossPct.toFixed(1)),
      transfer_mw: econResult.transfer_mw,
      annual_savings_mwh: econResult.annual_savings_mwh,
      annual_savings_usd: econResult.annual_savings_usd,
      co2_reduction_tonnes: econResult.co2_reduction_tonnes,
      payback_years: econResult.payback_years,
      total_investment_usd: econResult.total_investment_usd,
      infrastructure_breakdown: econResult.infrastructure_breakdown,
      seasonal_complementarity: seasonResult.complementarity,
      storage_recommended: seasonResult.storage_recommended || false,
      overlap_profile: seasonResult.overlap_profile,
      source_location: source.location,
      sink_location: sink.location,
    });
  }

  // Sort by composite score descending
  matches.sort((a, b) => b.composite_score - a.composite_score);

  return matches.slice(0, limit);
}

/**
 * Compute all possible matches across all facilities
 * @param {object[]} facilities - All registered facilities
 * @param {object} options - Matching options
 * @returns {object[]} All matches sorted by composite score
 */
function computeAllMatches(facilities, options = {}) {
  const sources = facilities.filter((f) => f.type === 'SOURCE');
  const matchMap = new Map();

  for (const source of sources) {
    const sourceMatches = computeMatches(source, facilities, options);
    for (const match of sourceMatches) {
      // Deduplicate: use sorted IDs as key
      const key = [match.source_id, match.sink_id].sort().join('-');
      if (!matchMap.has(key) || matchMap.get(key).composite_score < match.composite_score) {
        matchMap.set(key, match);
      }
    }
  }

  const allMatches = Array.from(matchMap.values());
  allMatches.sort((a, b) => b.composite_score - a.composite_score);

  return allMatches;
}

/**
 * Generate analytics summary from facilities and matches
 */
function generateAnalytics(facilities, matches) {
  const sources = facilities.filter((f) => f.type === 'SOURCE');
  const sinks = facilities.filter((f) => f.type === 'SINK');

  const totalHeatSupply = sources.reduce((sum, s) => sum + s.capacity_mw * s.availability, 0);
  const totalHeatDemand = sinks.reduce((sum, s) => sum + s.capacity_mw, 0);

  const totalSavingsMWh = matches.reduce((sum, m) => sum + m.annual_savings_mwh, 0);
  const totalSavingsUSD = matches.reduce((sum, m) => sum + m.annual_savings_usd, 0);
  const totalCO2Reduction = matches.reduce((sum, m) => sum + m.co2_reduction_tonnes, 0);
  const totalInvestment = matches.reduce((sum, m) => sum + m.total_investment_usd, 0);

  const avgComposite = matches.length > 0
    ? matches.reduce((sum, m) => sum + m.composite_score, 0) / matches.length
    : 0;

  // Category breakdown
  const sourceCategoryBreakdown = {};
  sources.forEach((s) => {
    if (!sourceCategoryBreakdown[s.category]) {
      sourceCategoryBreakdown[s.category] = { count: 0, total_mw: 0 };
    }
    sourceCategoryBreakdown[s.category].count++;
    sourceCategoryBreakdown[s.category].total_mw += s.capacity_mw;
  });

  const sinkCategoryBreakdown = {};
  sinks.forEach((s) => {
    if (!sinkCategoryBreakdown[s.category]) {
      sinkCategoryBreakdown[s.category] = { count: 0, total_mw: 0 };
    }
    sinkCategoryBreakdown[s.category].count++;
    sinkCategoryBreakdown[s.category].total_mw += s.capacity_mw;
  });

  // Monthly aggregate supply vs demand
  const monthlySupply = Array(12).fill(0);
  const monthlyDemand = Array(12).fill(0);
  sources.forEach((s) => {
    if (s.monthly_pattern) {
      s.monthly_pattern.forEach((m, i) => {
        monthlySupply[i] += s.capacity_mw * m * s.availability;
      });
    }
  });
  sinks.forEach((s) => {
    if (s.monthly_pattern) {
      s.monthly_pattern.forEach((m, i) => {
        monthlyDemand[i] += s.capacity_mw * m;
      });
    }
  });

  // Grade distribution
  const gradeDistribution = { LOW: 0, MID: 0, HIGH: 0 };
  facilities.forEach((f) => {
    if (gradeDistribution[f.grade] !== undefined) {
      gradeDistribution[f.grade]++;
    }
  });

  return {
    overview: {
      total_facilities: facilities.length,
      total_sources: sources.length,
      total_sinks: sinks.length,
      total_heat_supply_mw: parseFloat(totalHeatSupply.toFixed(1)),
      total_heat_demand_mw: parseFloat(totalHeatDemand.toFixed(1)),
      supply_demand_ratio: parseFloat((totalHeatSupply / Math.max(totalHeatDemand, 1)).toFixed(2)),
    },
    matching: {
      total_viable_matches: matches.length,
      avg_composite_score: parseFloat(avgComposite.toFixed(1)),
      top_score: matches.length > 0 ? matches[0].composite_score : 0,
      matches_above_70: matches.filter((m) => m.composite_score >= 70).length,
      matches_above_50: matches.filter((m) => m.composite_score >= 50).length,
    },
    impact: {
      total_annual_savings_mwh: totalSavingsMWh,
      total_annual_savings_usd: totalSavingsUSD,
      total_co2_reduction_tonnes: totalCO2Reduction,
      total_investment_required_usd: totalInvestment,
      avg_payback_years: matches.length > 0
        ? parseFloat((matches.reduce((s, m) => s + m.payback_years, 0) / matches.length).toFixed(1))
        : 0,
    },
    breakdown: {
      source_categories: sourceCategoryBreakdown,
      sink_categories: sinkCategoryBreakdown,
      grade_distribution: gradeDistribution,
    },
    seasonal: {
      monthly_supply_mw: monthlySupply.map((v) => parseFloat(v.toFixed(1))),
      monthly_demand_mw: monthlyDemand.map((v) => parseFloat(v.toFixed(1))),
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
  };
}

module.exports = { computeMatches, computeAllMatches, generateAnalytics, DEFAULT_WEIGHTS };
