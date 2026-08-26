const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes bắt đầu với /api/recipes
router.post('/', authMiddleware, recipeController.createRecipe);
router.get('/me', authMiddleware, recipeController.getMyRecipes);
router.get('/ingredient/:name', authMiddleware, recipeController.getIngredientInfo);
router.get('/:id', authMiddleware, recipeController.getRecipeById);
router.put('/:id', authMiddleware, recipeController.updateRecipe);
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

module.exports = router;
