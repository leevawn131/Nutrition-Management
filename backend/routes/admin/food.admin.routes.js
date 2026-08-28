const express = require('express');
const router = express.Router();
const foodAdminController = require('../../controllers/admin/food.admin.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/admin.middleware');

// Protect all admin food routes
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/foods - List foods (paginated, search, category & verification filter)
router.get('/', foodAdminController.listFoods);

// [GET] /api/admin/foods/:id - Single food item detail
router.get('/:id', foodAdminController.getFoodById);

// [POST] /api/admin/foods - Create new food item
router.post('/', foodAdminController.createFood);

// [PUT] /api/admin/foods/:id - Update food item
router.put('/:id', foodAdminController.updateFood);

// [DELETE] /api/admin/foods/:id - Delete food item with reference check
router.delete('/:id', foodAdminController.deleteFood);

module.exports = router;
