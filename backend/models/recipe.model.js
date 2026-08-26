const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    image_url: {
      type: String,
      default: null,
    },
    prep_time_minutes: {
      type: Number,
      default: null,
    },
    cook_time_minutes: {
      type: Number,
      default: null,
    },
    servings: {
      type: Number,
      required: [true, 'servings is required'],
    },
    calories_per_serving: {
      type: Number,
      default: null,
    },
    protein_g: {
      type: Number,
      default: null,
    },
    carb_g: {
      type: Number,
      default: null,
    },
    fat_g: {
      type: Number,
      default: null,
    },
    avg_rating: {
      type: Number,
      default: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
    },
    source_type: {
      type: String,
      enum: ['system', 'community'],
      required: true,
    },
    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    ingredients: [
      {
        ingredient_name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: null,
        },
        unit: {
          type: String,
          default: null,
        },
      },
    ],
    steps: [
      {
        step_number: {
          type: Number,
          required: true,
        },
        instruction: {
          type: String,
          required: true,
        },
      },
    ],
    nutrition_facts: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'recipes',
  }
);

// Indexes (đã được định nghĩa trong mongodb-setup.js)
recipeSchema.index({ title: 'text' });
recipeSchema.index({ source_type: 1, status: 1 });
recipeSchema.index({ created_by_user_id: 1 });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
