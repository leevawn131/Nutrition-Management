const express = require('express');
const router = express.Router();
const {
  getAllAchievements,
  getMyAchievements,
} = require('../controllers/achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', getAllAchievements);
router.get('/me', authMiddleware, getMyAchievements);

module.exports = router;
