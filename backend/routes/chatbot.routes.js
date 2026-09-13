const express = require('express');
const router = express.Router();
const { askChatbot } = require('../controllers/chatbot.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/ask', authMiddleware, askChatbot);

module.exports = router;
