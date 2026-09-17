const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const optionalAuth = require('../middlewares/optional_auth.middleware');

// GET /api/search?q=...&tab=recipes|ingredients|posts|users
router.get('/', optionalAuth, searchController.search);

module.exports = router;
