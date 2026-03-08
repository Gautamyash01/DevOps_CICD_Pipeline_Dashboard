const express = require('express');
const router = express.Router();
const { getBuilds, getRecentBuilds, createBuild } = require('../controllers/buildController');

// GET /api/builds
router.get('/', getBuilds);

// GET /api/builds/recent
router.get('/recent', getRecentBuilds);

// POST /api/builds
router.post('/', createBuild);

module.exports = router;
