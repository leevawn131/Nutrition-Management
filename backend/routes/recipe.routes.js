const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
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

// GET /api/recipes
router.get('/', optionalAuth, recipeController.getRecipes);

// GET /api/recipes/collections/my
router.get('/collections/my', optionalAuth, recipeController.getUserCollections);

// GET /api/recipes/:id
router.get('/:id', optionalAuth, recipeController.getRecipeById);

module.exports = router;
