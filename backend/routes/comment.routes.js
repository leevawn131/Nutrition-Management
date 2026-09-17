const express = require('express');
const router = express.Router();
const { addComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/:postId', authMiddleware, addComment);
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
