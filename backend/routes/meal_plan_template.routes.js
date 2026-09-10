const express = require('express');
const router = express.Router();
const mealPlanTemplateController = require('../controllers/meal_plan_template.controller');
const jwt = require('jsonwebtoken');

// Optional auth middleware
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

// GET /api/meal-plan-templates
router.get('/', optionalAuth, mealPlanTemplateController.getTemplates);

// GET /api/meal-plan-templates/:id
router.get('/:id', optionalAuth, mealPlanTemplateController.getTemplateById);

// POST /api/meal-plan-templates/:id/apply
router.post('/:id/apply', optionalAuth, mealPlanTemplateController.applyTemplate);

module.exports = router;
