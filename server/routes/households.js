const express = require('express');
const router = express.Router();
const { getHouseholds, getHouseholdById, searchHouseholds, updateHousehold, deleteHousehold } = require('../controllers/householdController');

// GET /api/households - Get all households with summary data
router.get('/', getHouseholds);

// GET /api/households/search - Search households by name
router.get('/search', searchHouseholds);

// GET /api/households/:id - Get household by ID with full details
router.get('/:id', getHouseholdById);

// PUT /api/households/:id - Update household fields
router.put('/:id', updateHousehold);

// DELETE /api/households/:id - Delete household
router.delete('/:id', deleteHousehold);

module.exports = router;
