const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/overview', gamificationController.getOverview);
router.post('/check-in', gamificationController.dailyCheckIn);
router.post('/claim-mission', gamificationController.claimMission);
router.post('/claim-badge', gamificationController.claimBadge);
router.post('/referral', gamificationController.applyReferral);
router.get('/point-history', gamificationController.getPointHistory);

module.exports = router;
