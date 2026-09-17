const User = require('../models/user.model');
const Post = require('../models/post.model');

// @desc    Lấy thông tin profile công khai của user khác
// @route   GET /api/social-users/:id
// @access  Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('achievements', 'name description icon')
      .select('-password_hash -role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Lưu bài viết
// @route   POST /api/social-users/save/:postId
// @access  Private
exports.savePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);

    user.saved_posts = user.saved_posts || [];
    const postIdStr = postId.toString();
    const alreadySaved = user.saved_posts.some((id) => id.toString() === postIdStr);

    if (!alreadySaved) {
      user.saved_posts.push(postId);
      await user.save();
    }
    res.json({ message: 'Post saved', savedPosts: user.saved_posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Bỏ lưu bài viết
// @route   DELETE /api/social-users/save/:postId
// @access  Private
exports.unsavePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);

    user.saved_posts = (user.saved_posts || []).filter(
      (id) => id.toString() !== postId.toString()
    );
    await user.save();
    res.json({ message: 'Post unsaved', savedPosts: user.saved_posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bài viết đã lưu
// @route   GET /api/social-users/saved-posts
// @access  Private
exports.getSavedPosts = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).populate({
      path: 'saved_posts',
      populate: { path: 'author', select: 'full_name avatar_url email' },
    });
    res.json(user?.saved_posts || []);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bạn bè
// @route   GET /api/social-users/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).populate(
      'friends',
      'full_name avatar_url email'
    );
    res.json(user?.friends || []);
  } catch (error) {
    next(error);
  }
};
