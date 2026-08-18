const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/profile
router.get('/', authMiddleware, profileController.getProfile);

// PUT /api/profile
router.put('/', authMiddleware, profileController.updateProfile);

module.exports = router;
