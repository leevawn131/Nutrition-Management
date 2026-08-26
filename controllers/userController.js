const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Cập nhật profile người dùng
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { profile, plan } = req.body;
    const user = await User.findById(req.user._id);

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (plan) {
      user.plan = { ...user.plan, ...plan };
    }

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin profile của user khác
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('achievements', 'name description icon')
      .select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Lưu bài viết
// @route   POST /api/users/save/:postId
// @access  Private
exports.savePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const user = await User.findById(req.user._id);

    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }
    res.json({ message: 'Post saved', savedPosts: user.savedPosts });
  } catch (error) {
    next(error);
  }
};

// @desc    Bỏ lưu bài viết
// @route   DELETE /api/users/save/:postId
// @access  Private
exports.unsavePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const user = await User.findById(req.user._id);

    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    await user.save();
    res.json({ message: 'Post unsaved', savedPosts: user.savedPosts });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bài viết đã lưu
// @route   GET /api/users/saved-posts
// @access  Private
exports.getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'username fullName avatar' }
    });
    res.json(user.savedPosts);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bạn bè
// @route   GET /api/users/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'username fullName avatar');
    res.json(user.friends);
  } catch (error) {
    next(error);
  }
};