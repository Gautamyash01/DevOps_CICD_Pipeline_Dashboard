const express = require('express');
const router = express.Router();
const { getDeployments, createDeployment } = require('../controllers/deploymentController');

// GET /api/deployments
router.get('/', getDeployments);

// POST /api/deployments
router.post('/', createDeployment);

module.exports = router;
