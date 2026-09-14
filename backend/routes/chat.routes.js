const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Shared Chat Contract endpoint: POST /api/chat/messages
router.post('/messages', authMiddleware, chatController.postMessage);

// Conversation management
router.get('/conversations', authMiddleware, chatController.getConversationsList);
router.get('/conversations/active', authMiddleware, chatController.getActiveConversation);
router.post('/conversations/reset', authMiddleware, chatController.resetConversation);
router.get('/conversations/:id', authMiddleware, chatController.getConversationById);
router.delete('/conversations/:id', authMiddleware, chatController.deleteConversation);

module.exports = router;
