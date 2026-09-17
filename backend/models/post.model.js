const mongoose = require('mongoose');

const postImageSchema = new mongoose.Schema(
  {
    image_url: {
      type: String,
      required: [true, 'image_url là bắt buộc'],
    },
    display_order: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id là bắt buộc'],
    },
    content: {
      type: String,
      default: null,
      trim: true,
    },
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'pending'],
      default: 'visible',
    },
    images: {
      type: [postImageSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

postSchema.index({ user_id: 1, created_at: -1 });
postSchema.index({ status: 1 });

const Post = mongoose.model('Post', postSchema, 'posts');

module.exports = Post;
