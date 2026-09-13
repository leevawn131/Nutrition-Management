const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/health/current
router.get('/current', authMiddleware, healthController.getCurrentHealth);

module.exports = router;
