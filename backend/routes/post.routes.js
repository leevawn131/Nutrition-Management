const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const optionalAuth = require('../middlewares/optional_auth.middleware');

// GET /api/posts/feed (bảng tin bài viết cộng đồng)
router.get('/feed', optionalAuth, postController.getFeed);

// POST /api/posts (tạo bài viết mới)
router.post('/', optionalAuth, postController.createPost);

// GET /api/posts/my-posts (lấy danh sách bài viết của chính mình)
router.get('/my-posts', optionalAuth, postController.getMyPosts);

// GET /api/posts/user/:userId (lấy danh sách bài viết của một người dùng)
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// GET /api/posts/:id (chi tiết bài viết)
router.get('/:id', optionalAuth, postController.getPostById);

// POST /api/posts/:id/like (thích / bỏ thích bài viết qua user_collections)
router.post('/:id/like', optionalAuth, postController.toggleLike);

// POST /api/posts/:id/report (báo cáo bài viết -> chuyển status sang 'pending')
router.post('/:id/report', optionalAuth, postController.reportPost);

// GET /api/posts/:id/comments (lấy danh sách bình luận)
router.get('/:id/comments', optionalAuth, postController.getComments);

// POST /api/posts/:id/comments (thêm bình luận -> lưu vào recipe_comments nếu post có recipe_id)
router.post('/:id/comments', optionalAuth, postController.addComment);

module.exports = router;
