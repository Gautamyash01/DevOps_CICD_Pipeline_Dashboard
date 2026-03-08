const express = require('express');
const router = express.Router();
const { getPipelines, createPipeline } = require('../controllers/pipelineController');

// GET /api/pipelines
router.get('/', getPipelines);

// POST /api/pipelines
router.post('/', createPipeline);

module.exports = router;
