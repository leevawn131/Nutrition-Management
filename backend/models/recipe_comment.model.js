const mongoose = require('mongoose');

const RecipeCommentSchema = new mongoose.Schema(
  {
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipeComment', default: null },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'recipe_comments',
  }
);

RecipeCommentSchema.index({ recipe_id: 1, status: 1, created_at: -1 });
RecipeCommentSchema.index({ user_id: 1 });

module.exports = mongoose.models.RecipeComment || mongoose.model('RecipeComment', RecipeCommentSchema, 'recipe_comments');
