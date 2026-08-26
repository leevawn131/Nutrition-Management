const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { awardPoints } = require('../services/gamificationService');

// @desc    Thêm bình luận
// @route   POST /api/comments/:postId
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const author = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author,
      content
    });

    // Thêm comment vào post
    post.comments.push(comment._id);
    await post.save();

    // Cộng điểm cho bình luận
    await awardPoints(author, 5, 'comment');

    await comment.populate('author', 'username fullName avatar');

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
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Kiểm tra quyền: tác giả comment hoặc tác giả bài viết
    if (
      comment.author.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.remove();
    // Xóa comment khỏi post
    post.comments.pull(comment._id);
    await post.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};