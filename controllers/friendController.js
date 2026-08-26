const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { awardPoints } = require('../services/gamificationService');

// @desc    Gửi yêu cầu kết bạn
// @route   POST /api/friends/request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const recipientId = req.params.userId;
    const requesterId = req.user._id;

    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra đã là bạn chưa
    const user = await User.findById(requesterId);
    if (user.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Kiểm tra yêu cầu đã tồn tại
    const existingRequest = await Friendship.findOne({
      requester: requesterId,
      recipient: recipientId
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
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
    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    // Cập nhật danh sách bạn bè cho cả hai
    await User.findByIdAndUpdate(friendship.requester, {
      $push: { friends: friendship.recipient }
    });
    await User.findByIdAndUpdate(friendship.recipient, {
      $push: { friends: friendship.requester }
    });

    // Cộng điểm cho cả hai
    await awardPoints(friendship.requester, 20, 'make_friend');
    await awardPoints(friendship.recipient, 20, 'make_friend');

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
    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    friendship.status = 'blocked'; // hoặc xóa
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
    const pending = await Friendship.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'username fullName avatar');

    res.json(pending);
  } catch (error) {
    next(error);
  }
};