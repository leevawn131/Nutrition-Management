const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request/:userId', protect, sendFriendRequest);
router.post('/accept/:requestId', protect, acceptFriendRequest);
router.post('/reject/:requestId', protect, rejectFriendRequest);
router.get('/pending', protect, getPendingRequests);

module.exports = router;