const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/goal/recommend
router.post('/recommend', authMiddleware, goalController.recommendGoal);

// PUT /api/goal/confirm
router.put('/confirm', authMiddleware, goalController.confirmGoal);

module.exports = router;
