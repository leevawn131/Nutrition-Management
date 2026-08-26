const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    name_en: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      default: null,
      trim: true,
    },
    calories_per_100g: {
      type: Number,
      required: [true, 'calories_per_100g is required'],
    },
    protein_per_100g: {
      type: Number,
      default: null,
    },
    carb_per_100g: {
      type: Number,
      default: null,
    },
    fat_per_100g: {
      type: Number,
      default: null,
    },
    image_url: {
      type: String,
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: true,
      required: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'food_items',
  }
);

// Indexes defined in database/mongodb-setup.js
foodItemSchema.index({ name: 'text', aliases: 'text' });
foodItemSchema.index({ category: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
