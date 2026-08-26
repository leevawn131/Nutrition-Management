const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Áp dụng middleware xác thực cho tất cả các route của meal
router.use(authMiddleware);

// POST /api/meals/analyze - Gửi ảnh để AI phân tích
router.post('/analyze', mealController.analyzeMealImage);

// POST /api/meals/analyze-text - Gửi đoạn văn bản để AI phân tích
router.post('/analyze-text', mealController.analyzeMealText);

// POST /api/meals/save - Lưu bữa ăn sau khi xác nhận
router.post('/save', mealController.saveMeal);

module.exports = router;
