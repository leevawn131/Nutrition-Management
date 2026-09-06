const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public or authenticated access to food catalog
router.get('/', foodController.getFoods);
router.get('/:id', foodController.getFoodById);

module.exports = router;
