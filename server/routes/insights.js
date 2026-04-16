const express = require('express');
const router = express.Router();
const { getInsights, getTopHouseholds } = require('../controllers/insightsController');

// GET /api/insights - Get all insights and analytics data
router.get('/', getInsights);

// GET /api/insights/top-households - Get top households by net worth
router.get('/top-households', getTopHouseholds);

module.exports = router;
