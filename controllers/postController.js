const Post = require('../models/Post');
const User = require('../models/User');
const { awardPoints } = require('../services/gamificationService');

// @desc    Tạo bài viết mới
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, tags, images } = req.body;
    const author = req.user._id;

    const post = await Post.create({
      author,
      content,
      tags: tags || [],
      images: images || []
    });

    // Cộng điểm cho đăng bài
    await awardPoints(author, 10, 'create_post');

    // Populate author
    await post.populate('author', 'username fullName avatar');

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả bài viết (feed)
// @route   GET /api/posts
// @access  Private (hoặc Public tuỳ thiết kế)
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username fullName avatar' }
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy bài viết theo ID
// @route   GET /api/posts/:id
// @access  Private
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username fullName avatar' }
      });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật bài viết
// @route   PUT /api/posts/:id
// @access  Private (chỉ tác giả)
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content, tags, images } = req.body;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (images) post.images = images;

    await post.save();
    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa bài viết
// @route   DELETE /api/posts/:id
// @access  Private (chỉ tác giả)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.remove();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike bài viết
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
      await post.save();
      res.json({ liked: false, likesCount: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();

      // Cộng điểm cho tác giả khi nhận like
      if (post.author.toString() !== userId.toString()) {
        await awardPoints(post.author, 2, 'receive_like');
      }

      res.json({ liked: true, likesCount: post.likes.length });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách người đã like bài viết
// @route   GET /api/posts/:id/likes
// @access  Private
exports.getPostLikes = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'username fullName avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.likes);
  } catch (error) {
    next(error);
  }
};