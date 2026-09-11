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

const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/recipes
router.get('/', optionalAuth, recipeController.getRecipes);

// GET /api/recipes/collections/my and /collections
router.get('/collections/my', optionalAuth, recipeController.getUserCollections);
router.get('/collections', optionalAuth, recipeController.getUserCollections);

// POST /api/recipes
router.post('/', authMiddleware, recipeController.createRecipe);

// PUT /api/recipes/:id
router.put('/:id', authMiddleware, recipeController.updateRecipe);

// DELETE /api/recipes/:id
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

// POST /api/recipes/:id/toggle-save and /save
router.post('/:id/toggle-save', optionalAuth, recipeController.toggleSaveRecipe);
router.post('/:id/save', optionalAuth, recipeController.toggleSaveRecipe);

// GET /api/recipes/:id/is-saved
router.get('/:id/is-saved', optionalAuth, recipeController.checkRecipeSaved);

// POST /api/recipes/:id/reviews and /comments
router.post('/:id/reviews', authMiddleware, recipeController.addRecipeReview);
router.post('/:id/comments', authMiddleware, recipeController.addRecipeReview);

// GET /api/recipes/:id
router.get('/:id', optionalAuth, recipeController.getRecipeById);

module.exports = router;
