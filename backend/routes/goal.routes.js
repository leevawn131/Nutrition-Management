const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/goal/recommend
router.post('/recommend', authMiddleware, goalController.recommendGoal);

// PUT /api/goal/confirm
router.put('/confirm', authMiddleware, goalController.confirmGoal);

// GET /api/goal/adherence
router.get('/adherence', authMiddleware, goalController.getGoalAdherence);

// POST /api/goal/apply-to-plan
router.post('/apply-to-plan', authMiddleware, goalController.applyGoalToPlan);

// POST /api/goal/adherence/confirm-adjustment
router.post('/adherence/confirm-adjustment', authMiddleware, goalController.confirmAdherenceAdjustment);

// POST /api/goal/meal-analysis/ai (Gemini 3.5 Flash)
router.post('/meal-analysis/ai', authMiddleware, goalController.getAIMealAnalysis);

// POST /api/goal/ai-chat (Conversational Goal Setting / Adjustment)
router.post('/ai-chat', authMiddleware, goalController.chatGoalConsultation);

module.exports = router;

