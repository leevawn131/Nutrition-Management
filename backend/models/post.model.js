const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: 5000,
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
    images: [{ type: String }],
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'posts',
  }
);

// Tự động đồng bộ author và user_id
postSchema.pre('save', function (next) {
  if (this.author && !this.user_id) {
    this.user_id = this.author;
  } else if (this.user_id && !this.author) {
    this.author = this.user_id;
  }
  next();
});

postSchema.index({ author: 1, created_at: -1 });
postSchema.index({ status: 1 });

module.exports = mongoose.model('Post', postSchema);
