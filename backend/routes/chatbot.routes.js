const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const optionalAuth = require('../middlewares/optional_auth.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// 1. Route chat tư vấn mục tiêu: Dùng optionalAuth để test được ngay cả khi chưa login
router.post('/goal-chat', optionalAuth, chatbotController.converseGoalSetting);

// 2. Route áp dụng mục tiêu: Bắt buộc đăng nhập để lưu vào CSDL của user
router.post('/apply-goal', authMiddleware, chatbotController.applyProposedGoal);

module.exports = router;