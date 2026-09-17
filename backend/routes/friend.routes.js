const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
} = require('../controllers/friend.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/request/:userId', authMiddleware, sendFriendRequest);
router.post('/accept/:requestId', authMiddleware, acceptFriendRequest);
router.post('/reject/:requestId', authMiddleware, rejectFriendRequest);
router.get('/pending', authMiddleware, getPendingRequests);

module.exports = router;
