const express = require('express');
const router = express.Router();
const {
  updateProfile,
  getUserById,
  savePost,
  unsavePost,
  getSavedPosts,
  getFriends
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateProfile);
router.get('/saved-posts', protect, getSavedPosts);
router.get('/friends', protect, getFriends);
router.post('/save/:postId', protect, savePost);
router.delete('/save/:postId', protect, unsavePost);
router.get('/:id', getUserById);

module.exports = router;