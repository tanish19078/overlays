/**
 * OverLays — Vercel Serverless API Handler
 * Wraps the Express app as a Vercel serverless function
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const facilitiesRouter = require('../server/routes/facilities');
const matchesRouter = require('../server/routes/matches');
const analyticsRouter = require('../server/routes/analytics');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── In-Memory Database ───────────────────────────────────
const facilitiesData = require('../server/data/facilities.json');

const db = {
  facilities: facilitiesData,
  cachedMatches: null,
};

// ─── Routes ───────────────────────────────────────────────
app.use('/api/facilities', facilitiesRouter(db));
app.use('/api/matches', matchesRouter(db));
app.use('/api/analytics', analyticsRouter(db));

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OverLays API',
    version: '1.0.0',
    runtime: 'vercel-serverless',
    facilities_loaded: db.facilities.length,
    matches_cached: db.cachedMatches ? db.cachedMatches.length : 0,
  });
});

// ─── Config endpoint ──────────────────────────────────────
app.get('/api/config/weights', (req, res) => {
  const { DEFAULT_WEIGHTS } = require('../server/engine/matching');
  res.json(DEFAULT_WEIGHTS);
});

// ─── 404 Handler ──────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: {
      health: 'GET /api/health',
      facilities: 'GET /api/facilities',
      matches: 'GET /api/matches',
      analytics: 'GET /api/analytics/summary',
    },
  });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
