/**
 * OverLays — Analytics API Routes
 */
const express = require('express');
const { computeAllMatches, generateAnalytics } = require('../engine/matching');
const router = express.Router();

module.exports = function (db) {
  /**
   * GET /api/analytics/summary
   * Full analytics summary including overview, impact, breakdown, seasonal trends
   */
  router.get('/summary', (req, res) => {
    if (!db.cachedMatches) {
      db.cachedMatches = computeAllMatches(db.facilities, {
        maxDistanceKm: 10,
        minCompositeScore: 20,
      });
    }

    const analytics = generateAnalytics(db.facilities, db.cachedMatches);
    res.json(analytics);
  });

  /**
   * GET /api/analytics/regional
   * Aggregated stats by region (clusters facilities by proximity)
   */
  router.get('/regional', (req, res) => {
    // Simple region clustering based on known city coordinates
    const regions = {
      'Mumbai-Pune': { lat: [18.0, 19.5], lng: [72.5, 74.5], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'Delhi-NCR': { lat: [28.0, 29.0], lng: [76.5, 78.0], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'Jamshedpur': { lat: [22.5, 23.0], lng: [85.5, 86.5], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'Hyderabad': { lat: [17.0, 17.8], lng: [78.0, 78.8], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'Gujarat': { lat: [21.0, 23.5], lng: [69.0, 73.5], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'Central India': { lat: [20.5, 25.0], lng: [74.0, 84.0], facilities: [], sources_mw: 0, sinks_mw: 0 },
      'South India': { lat: [10.0, 16.0], lng: [76.0, 80.0], facilities: [], sources_mw: 0, sinks_mw: 0 },
    };

    db.facilities.forEach((f) => {
      for (const [regionName, region] of Object.entries(regions)) {
        if (
          f.location.lat >= region.lat[0] &&
          f.location.lat <= region.lat[1] &&
          f.location.lng >= region.lng[0] &&
          f.location.lng <= region.lng[1]
        ) {
          region.facilities.push(f.id);
          if (f.type === 'SOURCE') region.sources_mw += f.capacity_mw;
          else region.sinks_mw += f.capacity_mw;
          break;
        }
      }
    });

    const regionSummary = Object.entries(regions)
      .filter(([, r]) => r.facilities.length > 0)
      .map(([name, r]) => ({
        region: name,
        facility_count: r.facilities.length,
        sources_mw: parseFloat(r.sources_mw.toFixed(1)),
        sinks_mw: parseFloat(r.sinks_mw.toFixed(1)),
        balance: parseFloat((r.sources_mw - r.sinks_mw).toFixed(1)),
      }));

    res.json({ regions: regionSummary });
  });

  /**
   * GET /api/analytics/savings-potential
   * Total potential savings if all viable matches are implemented
   */
  router.get('/savings-potential', (req, res) => {
    if (!db.cachedMatches) {
      db.cachedMatches = computeAllMatches(db.facilities, {
        maxDistanceKm: 10,
        minCompositeScore: 20,
      });
    }

    const matches = db.cachedMatches;

    const tiers = [
      { label: 'High viability (score ≥ 70)', matches: matches.filter((m) => m.composite_score >= 70) },
      { label: 'Medium viability (50-69)', matches: matches.filter((m) => m.composite_score >= 50 && m.composite_score < 70) },
      { label: 'Low viability (30-49)', matches: matches.filter((m) => m.composite_score >= 30 && m.composite_score < 50) },
    ];

    const tierSummary = tiers.map((t) => ({
      tier: t.label,
      count: t.matches.length,
      total_savings_mwh: t.matches.reduce((s, m) => s + m.annual_savings_mwh, 0),
      total_savings_usd: t.matches.reduce((s, m) => s + m.annual_savings_usd, 0),
      total_co2_tonnes: t.matches.reduce((s, m) => s + m.co2_reduction_tonnes, 0),
      total_investment: t.matches.reduce((s, m) => s + m.total_investment_usd, 0),
    }));

    res.json({
      total_matches: matches.length,
      tiers: tierSummary,
      grand_total: {
        savings_mwh: matches.reduce((s, m) => s + m.annual_savings_mwh, 0),
        savings_usd: matches.reduce((s, m) => s + m.annual_savings_usd, 0),
        co2_tonnes: matches.reduce((s, m) => s + m.co2_reduction_tonnes, 0),
        investment: matches.reduce((s, m) => s + m.total_investment_usd, 0),
      },
    });
  });

  /**
   * GET /api/analytics/seasonal-trends
   * Monthly supply vs demand trends
   */
  router.get('/seasonal-trends', (req, res) => {
    const sources = db.facilities.filter((f) => f.type === 'SOURCE');
    const sinks = db.facilities.filter((f) => f.type === 'SINK');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const trends = months.map((month, i) => {
      const supply = sources.reduce((sum, s) => {
        const factor = s.monthly_pattern ? s.monthly_pattern[i] : 1;
        return sum + s.capacity_mw * factor * s.availability;
      }, 0);

      const demand = sinks.reduce((sum, s) => {
        const factor = s.monthly_pattern ? s.monthly_pattern[i] : 1;
        return sum + s.capacity_mw * factor;
      }, 0);

      return {
        month,
        supply_mw: parseFloat(supply.toFixed(1)),
        demand_mw: parseFloat(demand.toFixed(1)),
        surplus_mw: parseFloat((supply - demand).toFixed(1)),
        match_potential_pct: parseFloat(
          (Math.min(supply, demand) / Math.max(supply, demand) * 100).toFixed(1)
        ),
      };
    });

    res.json({ trends });
  });

  return router;
};
