const express = require('express');
const router = express.Router();
const mealLogController = require('../controllers/meal_log.controller');
const jwt = require('jsonwebtoken');

// Optional auth helper: if token provided, set req.user
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        req.user = { id: decoded.id };
      }
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

// GET /api/meal-logs
router.get('/', optionalAuth, mealLogController.getMealLogs);

// GET /api/meal-logs/summary
router.get('/summary', optionalAuth, mealLogController.getDailySummary);

// GET /api/meal-logs/statistics
router.get('/statistics', optionalAuth, mealLogController.getStatistics);

// POST /api/meal-logs
router.post('/', optionalAuth, mealLogController.createMealLog);

// DELETE /api/meal-logs/:id
router.delete('/:id', optionalAuth, mealLogController.deleteMealLog);

module.exports = router;
