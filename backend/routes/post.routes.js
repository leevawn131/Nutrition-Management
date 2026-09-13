const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  getPostLikes,
} = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.route('/')
  .get(getAllPosts)
  .post(authMiddleware, createPost);

router.get('/:id', getPostById);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, likePost);
router.get('/:id/likes', authMiddleware, getPostLikes);

module.exports = router;
