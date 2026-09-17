const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Lấy danh sách bài viết cộng đồng (có thể xem công khai hoặc đã đăng nhập)
router.get('/', postController.getPosts);

// Lấy chi tiết bài viết
router.get('/:id', postController.getPostById);

// Đăng bài viết / chia sẻ bữa ăn (bắt buộc đăng nhập)
router.post('/', authMiddleware, postController.createPost);

module.exports = router;
