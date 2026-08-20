const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/meal_plan.controller');
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
      // ignore invalid token
    }
  }
  next();
};

// GET /api/meal-plans
router.get('/', optionalAuth, mealPlanController.getMealPlans);

// POST /api/meal-plans
router.post('/', optionalAuth, mealPlanController.addMealPlanItem);

// DELETE /api/meal-plans/:id
router.delete('/:id', optionalAuth, mealPlanController.deleteMealPlanItem);

module.exports = router;
