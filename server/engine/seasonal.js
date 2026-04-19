/**
 * OverLays — Seasonal Overlap Scoring
 * Computes how well supply and demand patterns align temporally
 */

/**
 * Normalize an array to [0, 1] range
 */
function normalize(arr) {
  const max = Math.max(...arr);
  if (max === 0) return arr.map(() => 0);
  return arr.map((v) => v / max);
}

/**
 * Compute monthly seasonal overlap score
 * Uses min-overlap method: at each month, overlap = min(supply, demand)
 * @param {number[]} sourceMonthly - 12-month supply multipliers
 * @param {number[]} sinkMonthly - 12-month demand multipliers
 * @returns {{ score: number, overlap_profile: number[], complementarity: string }}
 */
function seasonalOverlapScore(sourceMonthly, sinkMonthly) {
  if (!sourceMonthly || !sinkMonthly || sourceMonthly.length !== 12 || sinkMonthly.length !== 12) {
    return { score: 50, overlap_profile: [], complementarity: 'unknown' };
  }

  const sNorm = normalize(sourceMonthly);
  const dNorm = normalize(sinkMonthly);

  // Calculate overlap at each month
  const overlapProfile = sNorm.map((s, i) => Math.min(s, dNorm[i]));
  const totalOverlap = overlapProfile.reduce((sum, v) => sum + v, 0);
  const maxOverlap = dNorm.reduce((sum, v) => sum + v, 0);

  if (maxOverlap === 0) {
    return { score: 0, overlap_profile: overlapProfile, complementarity: 'none' };
  }

  const score = (totalOverlap / maxOverlap) * 100;

  // Classify complementarity pattern
  let complementarity = 'moderate';
  if (score >= 80) complementarity = 'excellent';
  else if (score >= 60) complementarity = 'good';
  else if (score >= 40) complementarity = 'moderate';
  else if (score >= 20) complementarity = 'poor';
  else complementarity = 'mismatched';

  // Check if thermal storage would help
  const storageBenefit = maxOverlap - totalOverlap;
  const storageRecommended = storageBenefit > 2.0 && score < 70;

  return {
    score: Math.round(score),
    overlap_profile: overlapProfile.map((v) => parseFloat(v.toFixed(3))),
    complementarity,
    storage_recommended: storageRecommended,
  };
}

/**
 * Compute hourly overlap score (for daily pattern matching)
 * @param {number[]} sourceHourly - 24-hour MW profile
 * @param {number[]} sinkHourly - 24-hour MW profile
 * @returns {{ score: number }}
 */
function hourlyOverlapScore(sourceHourly, sinkHourly) {
  if (!sourceHourly || !sinkHourly || sourceHourly.length !== 24 || sinkHourly.length !== 24) {
    return { score: 50 };
  }

  const sNorm = normalize(sourceHourly);
  const dNorm = normalize(sinkHourly);

  const overlap = sNorm.map((s, i) => Math.min(s, dNorm[i]));
  const totalOverlap = overlap.reduce((sum, v) => sum + v, 0);
  const maxOverlap = dNorm.reduce((sum, v) => sum + v, 0);

  if (maxOverlap === 0) return { score: 0 };

  return { score: Math.round((totalOverlap / maxOverlap) * 100) };
}

module.exports = { seasonalOverlapScore, hourlyOverlapScore };
