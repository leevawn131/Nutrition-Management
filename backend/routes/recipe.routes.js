const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/', authMiddleware, recipeController.createRecipe);
router.put('/:id', authMiddleware, recipeController.updateRecipe);
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);
router.post('/:id/reviews', authMiddleware, recipeController.addRecipeReview);
router.post('/:id/comments', authMiddleware, recipeController.addRecipeReview);

module.exports = router;
