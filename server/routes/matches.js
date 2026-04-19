/**
 * OverLays — Matches API Routes
 */
const express = require('express');
const { computeMatches, computeAllMatches } = require('../engine/matching');
const router = express.Router();

module.exports = function (db) {
  /**
   * GET /api/matches
   * Get all computed matches (uses cache if available)
   * Query params: min_score, limit, source_id, sink_id
   */
  router.get('/', (req, res) => {
    // Compute all matches if not cached
    if (!db.cachedMatches) {
      db.cachedMatches = computeAllMatches(db.facilities, {
        maxDistanceKm: 10,
        minCompositeScore: 20,
      });
    }

    let matches = [...db.cachedMatches];

    // Filter by min score
    if (req.query.min_score) {
      const minScore = parseFloat(req.query.min_score);
      matches = matches.filter((m) => m.composite_score >= minScore);
    }

    // Filter by source
    if (req.query.source_id) {
      matches = matches.filter((m) => m.source_id === req.query.source_id);
    }

    // Filter by sink
    if (req.query.sink_id) {
      matches = matches.filter((m) => m.sink_id === req.query.sink_id);
    }

    // Limit
    const limit = parseInt(req.query.limit) || 50;
    matches = matches.slice(0, limit);

    res.json({
      count: matches.length,
      matches,
    });
  });

  /**
   * GET /api/matches/top
   * Get top N match pairs
   */
  router.get('/top', (req, res) => {
    if (!db.cachedMatches) {
      db.cachedMatches = computeAllMatches(db.facilities, {
        maxDistanceKm: 10,
        minCompositeScore: 20,
      });
    }

    const n = parseInt(req.query.n) || 10;
    const topMatches = db.cachedMatches.slice(0, n);

    res.json({
      count: topMatches.length,
      matches: topMatches,
    });
  });

  /**
   * POST /api/matches/compute
   * Trigger matching for a specific facility
   * Body: { facility_id, max_distance_km?, min_score?, weights? }
   */
  router.post('/compute', (req, res) => {
    const { facility_id, max_distance_km, min_score, weights } = req.body;

    if (!facility_id) {
      return res.status(400).json({ error: 'facility_id is required' });
    }

    const facility = db.facilities.find((f) => f.id === facility_id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const options = {
      maxDistanceKm: max_distance_km || 10,
      minCompositeScore: min_score || 20,
    };
    if (weights) options.weights = weights;

    const matches = computeMatches(facility, db.facilities, options);

    res.json({
      facility_id,
      facility_name: facility.name,
      facility_type: facility.type,
      count: matches.length,
      matches,
    });
  });

  /**
   * GET /api/matches/:id
   * Get a specific match by ID
   */
  router.get('/:id', (req, res) => {
    if (!db.cachedMatches) {
      db.cachedMatches = computeAllMatches(db.facilities, {
        maxDistanceKm: 10,
        minCompositeScore: 20,
      });
    }

    const match = db.cachedMatches.find((m) => m.id === req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Enrich with full facility data
    const source = db.facilities.find((f) => f.id === match.source_id);
    const sink = db.facilities.find((f) => f.id === match.sink_id);

    res.json({
      ...match,
      source_detail: source || null,
      sink_detail: sink || null,
    });
  });

  return router;
};
