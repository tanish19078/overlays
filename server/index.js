/**
 * OverLays — Express Server Entry Point
 * Industrial Heat Waste Recovery Optimizer API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const facilitiesRouter = require('./routes/facilities');
const matchesRouter = require('./routes/matches');
const analyticsRouter = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// ─── In-Memory Database ───────────────────────────────────
// Load simulated facility data
const facilitiesData = require('./data/facilities.json');

const db = {
  facilities: facilitiesData,
  cachedMatches: null, // Populated on first match query
};

console.log(`📦 Loaded ${db.facilities.length} facilities from dataset`);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/facilities', facilitiesRouter(db));
app.use('/facilities', facilitiesRouter(db));

app.use('/api/matches', matchesRouter(db));
app.use('/matches', matchesRouter(db));

app.use('/api/analytics', analyticsRouter(db));
app.use('/analytics', analyticsRouter(db));

// ─── Serve Frontend (Production) ──────────────────────────
// In production, serve the Vite-built static files
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OverLays API',
    version: '1.0.0',
    uptime: process.uptime(),
    facilities_loaded: db.facilities.length,
    matches_cached: db.cachedMatches ? db.cachedMatches.length : 0,
  });
});

// ─── Config endpoint (scoring weights) ────────────────────
app.get('/api/config/weights', (req, res) => {
  const { DEFAULT_WEIGHTS } = require('./engine/matching');
  res.json(DEFAULT_WEIGHTS);
});

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: {
      health: 'GET /api/health',
      facilities: {
        list: 'GET /api/facilities',
        stats: 'GET /api/facilities/stats',
        get: 'GET /api/facilities/:id',
        create: 'POST /api/facilities',
        update: 'PUT /api/facilities/:id',
        delete: 'DELETE /api/facilities/:id',
      },
      matches: {
        list: 'GET /api/matches',
        top: 'GET /api/matches/top',
        compute: 'POST /api/matches/compute',
        get: 'GET /api/matches/:id',
      },
      analytics: {
        summary: 'GET /api/analytics/summary',
        regional: 'GET /api/analytics/regional',
        savings: 'GET /api/analytics/savings-potential',
        seasonal: 'GET /api/analytics/seasonal-trends',
      },
    },
  });
});

// ─── SPA Fallback (Production) ────────────────────────────
// All non-API routes serve the React app's index.html
if (process.env.NODE_ENV === 'production') {
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔥 OverLays API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏭 Facilities:   http://localhost:${PORT}/api/facilities`);
  console.log(`🔗 Matches:      http://localhost:${PORT}/api/matches`);
  console.log(`📈 Analytics:    http://localhost:${PORT}/api/analytics/summary\n`);
});

module.exports = app;
