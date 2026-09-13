const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');

// GET /api/foods
router.get('/', foodController.getFoodItems);

// GET /api/foods/:id
router.get('/:id', foodController.getFoodItemById);

module.exports = router;
