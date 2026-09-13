const Post = require('../models/post.model');
const User = require('../models/user.model');
const { awardPoints } = require('../services/gamification.service');

// @desc    Tạo bài viết mới
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, tags, images } = req.body;
    const author = req.user?.id || req.user?._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.create({
      author,
      user_id: author,
      content: content.trim(),
      tags: tags || [],
      images: images || [],
    });

    // Cộng điểm cho đăng bài
    try {
      await awardPoints(author, 10, 'create_post');
    } catch (err) {
      console.error('awardPoints error:', err.message);
    }

    await post.populate('author', 'full_name avatar_url email');

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả bài viết (feed)
// @route   GET /api/posts
// @access  Public / Private
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'full_name avatar_url email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'full_name avatar_url email' },
      })
      .sort({ createdAt: -1, created_at: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy bài viết theo ID
// @route   GET /api/posts/:id
// @access  Public / Private
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'full_name avatar_url email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'full_name avatar_url email' },
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
    const currentUserId = (req.user?.id || req.user?._id)?.toString();
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postAuthorId = (post.author || post.user_id)?.toString();
    if (postAuthorId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content, tags, images } = req.body;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (images !== undefined) post.images = images;

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
    const currentUserId = (req.user?.id || req.user?._id)?.toString();
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postAuthorId = (post.author || post.user_id)?.toString();
    if (postAuthorId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.deleteOne({ _id: post._id });
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

    const userId = req.user?.id || req.user?._id;
    const userIdStr = userId?.toString();
    const alreadyLiked = (post.likes || []).some((id) => id.toString() === userIdStr);

    if (alreadyLiked) {
      post.likes.pull(userId);
      await post.save();
      res.json({ liked: false, likesCount: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();

      // Cộng điểm cho tác giả khi nhận like
      const postAuthorId = (post.author || post.user_id)?.toString();
      if (postAuthorId && postAuthorId !== userIdStr) {
        try {
          await awardPoints(post.author || post.user_id, 2, 'receive_like');
        } catch (err) {
          console.error('awardPoints error:', err.message);
        }
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
    const post = await Post.findById(req.params.id).populate('likes', 'full_name avatar_url email');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.likes);
  } catch (error) {
    next(error);
  }
};
