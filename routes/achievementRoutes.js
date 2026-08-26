const express = require('express');
const router = express.Router();
const {
  getAllAchievements,
  getMyAchievements
} = require('../controllers/achievementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllAchievements);
router.get('/me', protect, getMyAchievements);

module.exports = router;