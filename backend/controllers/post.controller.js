const postService = require('../services/post.service');

class PostController {
  /**
   * POST /api/posts - Đăng bài viết / Chia sẻ bữa ăn lên MXH
   */
  async createPost(req, res) {
    try {
      const userId = req.user.id;
      const { content, images, recipe_id } = req.body;

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp nội dung hoặc hình ảnh bài viết',
        });
      }

      const post = await postService.createPost(userId, {
        content,
        images,
        recipe_id,
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng bài viết lên mạng xã hội thành công',
        data: post,
      });
    } catch (error) {
      console.error('Lỗi controller createPost:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi đăng bài viết',
      });
    }
  }

  /**
   * GET /api/posts - Lấy danh sách bài viết cộng đồng
   */
  async getPosts(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await postService.getPosts({ page, limit });

      return res.status(200).json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
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
   * GET /api/posts/:id - Lấy chi tiết bài viết
   */
  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await postService.getPostById(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết',
        });
      }

      return res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Lỗi controller getPostById:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi tải bài viết',
      });
    }
  }
}

module.exports = new PostController();
