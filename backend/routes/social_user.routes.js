const express = require('express');
const router = express.Router();
const {
  getUserById,
  savePost,
  unsavePost,
  getSavedPosts,
  getFriends,
} = require('../controllers/social_user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/saved-posts', authMiddleware, getSavedPosts);
router.get('/friends', authMiddleware, getFriends);
router.post('/save/:postId', authMiddleware, savePost);
router.delete('/save/:postId', authMiddleware, unsavePost);
router.get('/:id', getUserById);

module.exports = router;
