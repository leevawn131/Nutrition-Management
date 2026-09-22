const postService = require('../services/post.service');
const User = require('../models/user.model');

const getEffectiveUserId = async (req) => {
  if (req.user && (req.user.id || req.user._id)) {
    const uid = req.user.id || req.user._id;
    const userExists = await User.findById(uid).lean();
    if (userExists) return uid;
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

class PostController {
  /**
   * GET /api/posts/feed
   */
  async getFeed(req, res) {
    try {
      const userId = req.user ? req.user.id || req.user._id : await getEffectiveUserId(req);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const posts = await postService.getFeed({ userId, page, limit });
      return res.json({
        success: true,
        data: posts,
      });
    } catch (err) {
      console.error('Lỗi getFeed:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi lấy bảng tin bài viết',
      });
    }
  }

  /**
   * GET /api/posts - Lấy danh sách bài viết cộng đồng (alias)
   */
  async getPosts(req, res) {
    try {
      const userId = req.user ? req.user.id || req.user._id : await getEffectiveUserId(req);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const posts = await postService.getFeed({ userId, page, limit });
      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error('Lỗi controller getPosts:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi tải danh sách bài viết',
      });
    }
  }

  /**
   * POST /api/posts - Đăng bài viết / Chia sẻ bữa ăn lên MXH
   */
  async createPost(req, res) {
    try {
      const userId = (req.user && (req.user.id || req.user._id)) || (await getEffectiveUserId(req));
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để đăng bài viết',
        });
      }
      const { content, recipe_id, recipeId, images } = req.body;

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp nội dung hoặc hình ảnh bài viết',
        });
      }

      const post = await postService.createPost({
        userId,
        content,
        recipeId: recipe_id || recipeId,
        images,
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng bài viết lên mạng xã hội thành công',
        data: post,
      });
    } catch (err) {
      console.error('Lỗi createPost:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi tạo bài viết',
      });
    }
  }

  /**
   * GET /api/posts/:id
   */
  async getPostById(req, res) {
    try {
      const userId = req.user ? req.user.id || req.user._id : null;
      const postId = req.params.id;

      const post = await postService.getPostById({ postId, userId });
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết',
        });
      }
      return res.json({
        success: true,
        data: post,
      });
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Không tìm thấy bài viết',
      });
    }
  }

  /**
   * POST /api/posts/:id/like
   */
  async toggleLike(req, res) {
    try {
      const userId = await getEffectiveUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để thích bài viết',
        });
      }
      const postId = req.params.id;

      const result = await postService.toggleLikePost({ userId, postId });
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Lỗi toggleLike:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi cập nhật lượt thích',
      });
    }
  }

  /**
   * POST /api/posts/:id/report
   */
  async reportPost(req, res) {
    try {
      const userId = await getEffectiveUserId(req);
      const postId = req.params.id;
      const { reason } = req.body;

      const result = await postService.reportPost({ userId, postId, reason });
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      console.error('Lỗi reportPost:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi báo cáo bài viết',
      });
    }
  }

  /**
   * GET /api/posts/:id/comments
   */
  async getComments(req, res) {
    try {
      const postId = req.params.id;
      const comments = await postService.getPostComments({ postId });
      return res.json({
        success: true,
        data: comments,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi lấy danh sách bình luận',
      });
    }
  }

  /**
   * POST /api/posts/:id/comments
   */
  async addComment(req, res) {
    try {
      const userId = await getEffectiveUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để bình luận bài viết',
        });
      }
      const postId = req.params.id;
      const { content } = req.body;

      const comments = await postService.addPostComment({ userId, postId, content });
      return res.status(201).json({
        success: true,
        message: 'Đã bình luận bài viết thành công',
        data: comments,
      });
    } catch (err) {
      console.error('Lỗi addComment:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Bài viết này không đính kèm công thức nên không thể bình luận',
      });
    }
  }

  /**
   * GET /api/posts/my-posts
   */
  async getMyPosts(req, res) {
    try {
      const userId = await getEffectiveUserId(req);
      if (!userId) {
        return res.json({ success: true, data: [] });
      }
      const posts = await postService.getUserPosts({ targetUserId: userId, currentUserId: userId });
      return res.json({
        success: true,
        data: posts,
      });
    } catch (err) {
      console.error('Lỗi getMyPosts:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi lấy bài viết cá nhân',
      });
    }
  }

  /**
   * GET /api/posts/user/:userId
   */
  async getUserPosts(req, res) {
    try {
      const currentUserId = req.user ? req.user.id || req.user._id : await getEffectiveUserId(req);
      const targetUserId = req.params.userId;
      const posts = await postService.getUserPosts({ targetUserId, currentUserId });
      return res.json({
        success: true,
        data: posts,
      });
    } catch (err) {
      console.error('Lỗi getUserPosts:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi lấy bài viết của người dùng',
      });
    }
  }
}

module.exports = new PostController();
