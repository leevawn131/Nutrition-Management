const User = require('../models/user.model');
const Friendship = require('../models/friendship.model');
const { awardPoints } = require('../services/gamification.service');

// @desc    Gửi yêu cầu kết bạn
// @route   POST /api/friends/request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const recipientId = req.params.userId;
    const requesterId = (req.user?.id || req.user?._id)?.toString();

    if (recipientId === requesterId) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra đã là bạn chưa
    const user = await User.findById(requesterId);
    if ((user.friends || []).map((f) => f.toString()).includes(recipientId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Kiểm tra yêu cầu đã tồn tại
    const existingRequest = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent or exists' });
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    res.status(201).json(friendship);
  } catch (error) {
    next(error);
  }
};

// @desc    Chấp nhận yêu cầu kết bạn
// @route   POST /api/friends/accept/:requestId
// @access  Private
exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const currentUserId = (req.user?.id || req.user?._id)?.toString();
    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    // Cập nhật danh sách bạn bè cho cả hai
    await User.findByIdAndUpdate(friendship.requester, {
      $addToSet: { friends: friendship.recipient },
    });
    await User.findByIdAndUpdate(friendship.recipient, {
      $addToSet: { friends: friendship.requester },
    });

    // Cộng điểm cho cả hai
    try {
      await awardPoints(friendship.requester, 20, 'make_friend');
      await awardPoints(friendship.recipient, 20, 'make_friend');
    } catch (err) {
      console.error('awardPoints error:', err.message);
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Từ chối yêu cầu kết bạn
// @route   POST /api/friends/reject/:requestId
// @access  Private
exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const currentUserId = (req.user?.id || req.user?._id)?.toString();
    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    friendship.status = 'blocked';
    await friendship.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách yêu cầu kết bạn đang chờ
// @route   GET /api/friends/pending
// @access  Private
exports.getPendingRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const pending = await Friendship.find({
      recipient: currentUserId,
      status: 'pending',
    }).populate('requester', 'full_name avatar_url email');

    res.json(pending);
  } catch (error) {
    next(error);
  }
};
