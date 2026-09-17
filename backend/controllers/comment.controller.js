const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const { awardPoints } = require('../services/gamification.service');

// @desc    Thêm bình luận
// @route   POST /api/comments/:postId
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const author = req.user?.id || req.user?._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author,
      content: content.trim(),
    });

    // Thêm comment vào post
    post.comments.push(comment._id);
    await post.save();

    // Cộng điểm cho bình luận
    try {
      await awardPoints(author, 5, 'comment');
    } catch (err) {
      console.error('awardPoints error:', err.message);
    }

    await comment.populate('author', 'full_name avatar_url email');

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa bình luận
// @route   DELETE /api/comments/:id
// @access  Private (chỉ tác giả hoặc chủ bài viết)
exports.deleteComment = async (req, res, next) => {
  try {
    const currentUserId = (req.user?.id || req.user?._id)?.toString();
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentAuthorId = comment.author?.toString();
    const postAuthorId = (post.author || post.user_id)?.toString();

    // Kiểm tra quyền: tác giả comment hoặc tác giả bài viết
    if (commentAuthorId !== currentUserId && postAuthorId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.deleteOne({ _id: comment._id });

    // Xóa comment khỏi post
    post.comments.pull(comment._id);
    await post.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};
