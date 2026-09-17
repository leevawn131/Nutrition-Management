const mongoose = require('mongoose');
const Post = require('../models/post.model');
const UserCollection = require('../models/user_collection.model');
const RecipeComment = require('../models/recipe_comment.model');
const Recipe = require('../models/recipe.model');
const User = require('../models/user.model');
const ModerationLog = require('../models/moderation_log.model');

const LIKED_POSTS_COLLECTION_NAME = 'Bài viết đã thích';

class PostService {
  /**
   * Format single post item with full recipe details and like/comment counts
   */
  async formatPost(post, userId) {
    // Count total likes across user_collections containing this post_id
    const likeCount = await UserCollection.countDocuments({
      'items.item_type': 'post',
      'items.item_id': post._id,
    });

    // Check if current user liked this post
    let isLiked = false;
    if (userId) {
      const userLikedDoc = await UserCollection.findOne({
        user_id: userId,
        'items.item_type': 'post',
        'items.item_id': post._id,
      });
      isLiked = Boolean(userLikedDoc);
    }

    // Count comments if recipe_id exists
    let commentCount = 0;
    if (post.recipe_id) {
      commentCount = await RecipeComment.countDocuments({
        recipe_id: post.recipe_id._id || post.recipe_id,
        status: 'visible',
      });
    }

    const recipeData = post.recipe_id && typeof post.recipe_id === 'object' ? post.recipe_id : null;

    return {
      id: post._id,
      _id: post._id,
      user: {
        id: post.user_id?._id || post.user_id,
        full_name: post.user_id?.full_name || 'Người dùng',
        avatar_url: post.user_id?.avatar_url || null,
      },
      content: post.content || '',
      images: (post.images || []).map((img) => img.image_url || img),
      recipe: recipeData
        ? {
            id: recipeData._id,
            _id: recipeData._id,
            title: recipeData.title,
            image_url: recipeData.image_url,
            prep_time_minutes: recipeData.prep_time_minutes || 0,
            cook_time_minutes: recipeData.cook_time_minutes || 0,
            total_time_minutes: (recipeData.prep_time_minutes || 0) + (recipeData.cook_time_minutes || 0),
            ingredient_count: (recipeData.ingredients || []).length,
            ingredients: recipeData.ingredients || [],
            steps: recipeData.steps || [],
            calories_per_serving: recipeData.calories_per_serving || 0,
            protein_g: recipeData.protein_g || 0,
            carb_g: recipeData.carb_g || 0,
            fat_g: recipeData.fat_g || 0,
          }
        : null,
      recipe_id: recipeData?._id || post.recipe_id || null,
      like_count: likeCount,
      comment_count: commentCount,
      is_liked: isLiked,
      status: post.status,
      created_at: post.created_at,
    };
  }

  /**
   * Fetch Social Feed Posts
   */
  async getFeed({ userId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: 'visible' })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'full_name avatar_url email')
      .populate('recipe_id', 'title image_url prep_time_minutes cook_time_minutes ingredients steps calories_per_serving protein_g carb_g fat_g')
      .lean();

    return Promise.all(posts.map((post) => this.formatPost(post, userId)));
  }

  /**
   * Fetch Posts by User (My Posts or Profile Posts)
   */
  async getUserPosts({ targetUserId, currentUserId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const filter = { user_id: targetUserId };
    if (String(currentUserId) !== String(targetUserId)) {
      filter.status = 'visible';
    } else {
      filter.status = { $in: ['visible', 'pending'] };
    }

    const posts = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'full_name avatar_url email')
      .populate('recipe_id', 'title image_url prep_time_minutes cook_time_minutes ingredients steps calories_per_serving protein_g carb_g fat_g')
      .lean();

    return Promise.all(posts.map((post) => this.formatPost(post, currentUserId)));
  }

  /**
   * Create New Post
   */
  async createPost({ userId, content, recipeId, images = [] }) {
    if (!content && (!images || images.length === 0)) {
      throw new Error('Nội dung bài viết hoặc hình ảnh không được để trống');
    }

    if (content && content.length > 5000) {
      throw new Error('Nội dung bài viết vượt quá 5000 ký tự');
    }

    let validRecipeId = null;
    if (recipeId && mongoose.Types.ObjectId.isValid(recipeId)) {
      const existingRecipe = await Recipe.findById(recipeId);
      if (existingRecipe) {
        validRecipeId = existingRecipe._id;
      }
    }

    const formattedImages = (images || [])
      .filter((img) => img && (typeof img === 'string' ? img.trim() : img.image_url))
      .map((imgUrl, index) => ({
        image_url: typeof imgUrl === 'string' ? imgUrl.trim() : imgUrl.image_url,
        display_order: index + 1,
      }));

    const newPost = new Post({
      user_id: userId,
      content: content || '',
      recipe_id: validRecipeId,
      status: 'visible',
      images: formattedImages,
      created_at: new Date(),
    });

    await newPost.save();

    // Trigger Gamification: Tự động cộng 15 điểm cho bài viết cộng đồng
    try {
      const gamificationService = require('./gamification.service');
      gamificationService.awardPoints(userId, 15, 'Chia sẻ bài viết cộng đồng').catch((e) => console.warn('Gamification post award error:', e.message));
    } catch (e) {
      console.warn('Gamification trigger error:', e.message);
    }

    return this.getPostById({ postId: newPost._id, userId });
  }

  /**
   * Fetch Single Post Details
   */
  async getPostById({ postId, userId }) {
    const post = await Post.findById(postId)
      .populate('user_id', 'full_name avatar_url email')
      .populate('recipe_id', 'title image_url prep_time_minutes cook_time_minutes ingredients steps calories_per_serving protein_g carb_g fat_g')
      .lean();

    if (!post) throw new Error('Bài viết không tồn tại');
    return this.formatPost(post, userId);
  }

  /**
   * Toggle Like Post via user_collections
   */
  async toggleLikePost({ userId, postId }) {
    let collection = await UserCollection.findOne({
      user_id: userId,
      name: LIKED_POSTS_COLLECTION_NAME,
    });

    if (!collection) {
      collection = new UserCollection({
        user_id: userId,
        name: LIKED_POSTS_COLLECTION_NAME,
        items: [],
        created_at: new Date(),
      });
    }

    const existingIndex = collection.items.findIndex(
      (item) => item.item_type === 'post' && item.item_id.toString() === postId.toString()
    );

    let isLiked = false;
    if (existingIndex >= 0) {
      // Remove item (unlike)
      collection.items.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Add item (like)
      collection.items.push({
        item_type: 'post',
        item_id: postId,
        added_at: new Date(),
      });
      isLiked = true;
    }

    await collection.save();

    const likeCount = await UserCollection.countDocuments({
      'items.item_type': 'post',
      'items.item_id': postId,
    });

    return { is_liked: isLiked, like_count: likeCount };
  }

  /**
   * Report Post (Sets status to 'pending')
   */
  async reportPost({ userId, postId, reason }) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Bài viết không tồn tại');

    post.status = 'pending';
    await post.save();

    const modLog = new ModerationLog({
      admin_id: userId,
      target_type: 'post',
      target_id: postId,
      action: 'hide',
      reason: reason || 'Báo cáo vi phạm từ người dùng',
      created_at: new Date(),
    });
    await modLog.save().catch((err) => console.log('Lỗi lưu moderation log:', err));

    return { message: 'Đã gửi báo cáo bài viết. Cảm ơn phản hồi của bạn.' };
  }

  /**
   * Get Comments for Post (from recipe_comments)
   */
  async getPostComments({ postId }) {
    const post = await Post.findById(postId);
    if (!post || !post.recipe_id) {
      return [];
    }

    const comments = await RecipeComment.find({
      recipe_id: post.recipe_id,
      status: 'visible',
    })
      .sort({ created_at: 1 })
      .populate('user_id', 'full_name avatar_url')
      .lean();

    return comments.map((c) => ({
      id: c._id,
      _id: c._id,
      user: {
        id: c.user_id?._id || c.user_id,
        full_name: c.user_id?.full_name || 'Người dùng',
        avatar_url: c.user_id?.avatar_url || null,
      },
      content: c.content,
      rating: c.rating || null,
      created_at: c.created_at,
    }));
  }

  /**
   * Add Comment to Post (saves to recipe_comments if recipe_id exists)
   */
  async addPostComment({ userId, postId, content }) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Bài viết không tồn tại');
    if (!post.recipe_id) {
      throw new Error('Bài viết này không đính kèm công thức nên không thể bình luận');
    }

    if (!content || !content.trim()) {
      throw new Error('Nội dung bình luận không được để trống');
    }

    const comment = new RecipeComment({
      recipe_id: post.recipe_id,
      user_id: userId,
      content: content.trim(),
      status: 'visible',
      created_at: new Date(),
    });

    await comment.save();
    return this.getPostComments({ postId });
  }
}

module.exports = new PostService();
