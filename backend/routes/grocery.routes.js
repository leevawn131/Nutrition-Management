const express = require('express');
const router = express.Router();
const groceryController = require('../controllers/grocery.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/add-from-recipe', authMiddleware, groceryController.addFromRecipe);

module.exports = router;
