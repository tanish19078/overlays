/**
 * OverLays — Facilities API Routes
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = function (db) {
  /**
   * GET /api/facilities
   * List all facilities with optional filters
   * Query params: type (SOURCE|SINK), grade (LOW|MID|HIGH), category
   */
  router.get('/', (req, res) => {
    let facilities = [...db.facilities];

    // Filter by type
    if (req.query.type) {
      facilities = facilities.filter(
        (f) => f.type === req.query.type.toUpperCase()
      );
    }

    // Filter by grade
    if (req.query.grade) {
      facilities = facilities.filter(
        (f) => f.grade === req.query.grade.toUpperCase()
      );
    }

    // Filter by category
    if (req.query.category) {
      facilities = facilities.filter((f) => f.category === req.query.category);
    }

    res.json({
      count: facilities.length,
      facilities,
    });
  });

  /**
   * GET /api/facilities/stats
   * Get aggregate statistics
   */
  router.get('/stats', (req, res) => {
    const sources = db.facilities.filter((f) => f.type === 'SOURCE');
    const sinks = db.facilities.filter((f) => f.type === 'SINK');

    res.json({
      total: db.facilities.length,
      sources: sources.length,
      sinks: sinks.length,
      total_source_capacity_mw: parseFloat(
        sources.reduce((sum, s) => sum + s.capacity_mw, 0).toFixed(1)
      ),
      total_sink_demand_mw: parseFloat(
        sinks.reduce((sum, s) => sum + s.capacity_mw, 0).toFixed(1)
      ),
      categories: [...new Set(db.facilities.map((f) => f.category))],
    });
  });

  /**
   * GET /api/facilities/:id
   * Get a single facility by ID
   */
  router.get('/:id', (req, res) => {
    const facility = db.facilities.find((f) => f.id === req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(facility);
  });

  /**
   * POST /api/facilities
   * Register a new facility
   */
  router.post('/', (req, res) => {
    const {
      name,
      type,
      category,
      location,
      address,
      capacity_mw,
      temp_min_c,
      temp_max_c,
      temp_avg_c,
      grade,
      hourly_pattern,
      monthly_pattern,
      availability,
      has_heat_exchanger,
      pipe_ready,
      available_space_m2,
      heating_cost_per_mwh,
      currency,
      investment_budget,
      organization,
      contact_email,
    } = req.body;

    // Basic validation
    if (!name || !type || !category || !location || !capacity_mw) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, category, location, capacity_mw',
      });
    }

    if (!['SOURCE', 'SINK'].includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'type must be SOURCE or SINK' });
    }

    const facility = {
      id: `${type.toLowerCase().slice(0, 3)}-${uuidv4().slice(0, 8)}`,
      name,
      type: type.toUpperCase(),
      category,
      location,
      address: address || '',
      capacity_mw: parseFloat(capacity_mw),
      temp_min_c: parseFloat(temp_min_c || 0),
      temp_max_c: parseFloat(temp_max_c || 0),
      temp_avg_c: parseFloat(temp_avg_c || 0),
      grade: (grade || 'LOW').toUpperCase(),
      hourly_pattern: hourly_pattern || Array(24).fill(capacity_mw * 0.8),
      monthly_pattern: monthly_pattern || Array(12).fill(1.0),
      availability: parseFloat(availability || 0.9),
      has_heat_exchanger: Boolean(has_heat_exchanger),
      pipe_ready: Boolean(pipe_ready),
      available_space_m2: parseFloat(available_space_m2 || 0),
      heating_cost_per_mwh: parseFloat(heating_cost_per_mwh || 0),
      currency: currency || 'INR',
      investment_budget: parseFloat(investment_budget || 0),
      organization: organization || '',
      contact_email: contact_email || '',
      created_at: new Date().toISOString(),
    };

    db.facilities.push(facility);

    // Clear cached matches since data changed
    db.cachedMatches = null;

    res.status(201).json(facility);
  });

  /**
   * PUT /api/facilities/:id
   * Update an existing facility
   */
  router.put('/:id', (req, res) => {
    const index = db.facilities.findIndex((f) => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const updated = { ...db.facilities[index], ...req.body, id: req.params.id };
    db.facilities[index] = updated;
    db.cachedMatches = null;

    res.json(updated);
  });

  /**
   * DELETE /api/facilities/:id
   * Remove a facility
   */
  router.delete('/:id', (req, res) => {
    const index = db.facilities.findIndex((f) => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    db.facilities.splice(index, 1);
    db.cachedMatches = null;

    res.json({ message: 'Facility deleted', id: req.params.id });
  });

  return router;
};
