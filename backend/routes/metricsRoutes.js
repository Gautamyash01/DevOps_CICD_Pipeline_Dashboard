const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/metricsController');

// GET /api/metrics/dashboard
router.get('/dashboard', getDashboardMetrics);

module.exports = router;
