const Post = require('../models/post.model');

class PostService {
  /**
   * Tạo bài viết mới (chia sẻ bữa ăn hoặc bài viết cá nhân)
   */
  async createPost(userId, postData) {
    const { content, recipe_id, images, status = 'visible' } = postData;

    // Chuẩn hóa danh sách ảnh
    let formattedImages = [];
    if (Array.isArray(images)) {
      formattedImages = images.map((img, index) => {
        if (typeof img === 'string') {
          return { image_url: img, display_order: index + 1 };
        }
        return {
          image_url: img.image_url,
          display_order: img.display_order || index + 1,
        };
      });
    }

    const newPost = new Post({
      user_id: userId,
      content: content || '',
      recipe_id: recipe_id || null,
      status: status || 'visible',
      images: formattedImages,
      created_at: new Date(),
    });

    const savedPost = await newPost.save();
    return await Post.findById(savedPost._id).populate(
      'user_id',
      'full_name avatar_url email'
    );
  }

  /**
   * Lấy danh sách bài viết trên bảng tin cộng đồng (Explore feed)
   */
  async getPosts({ page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const posts = await Post.find({ status: 'visible' })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('user_id', 'full_name avatar_url email')
      .populate('recipe_id', 'title cover_image_url calories');

    const total = await Post.countDocuments({ status: 'visible' });

    return {
      posts,
      pagination: {
        total,
        page: parseInt(page, 10),
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Lấy chi tiết bài viết
   */
  async getPostById(postId) {
    const post = await Post.findById(postId)
      .populate('user_id', 'full_name avatar_url email')
      .populate('recipe_id');
    return post;
  }
}

module.exports = new PostService();
