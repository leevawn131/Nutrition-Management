const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Tên món ăn là bắt buộc'],
      trim: true,
    },
    name_en: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    calories_per_100g: {
      type: Number,
      required: [true, 'Số calo trên 100g là bắt buộc'],
      min: [0, 'Calo không được nhỏ hơn 0'],
    },
    protein_per_100g: {
      type: Number,
      default: 0,
      min: [0, 'Đạm không được nhỏ hơn 0'],
    },
    carb_per_100g: {
      type: Number,
      default: 0,
      min: [0, 'Đường bột không được nhỏ hơn 0'],
    },
    fat_per_100g: {
      type: Number,
      default: 0,
      min: [0, 'Chất béo không được nhỏ hơn 0'],
    },
    image_url: {
      type: String,
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: true,
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
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use created_at to match schema
  }
);

// Create compound text index for searching name and aliases
foodItemSchema.index({ name: 'text', aliases: 'text' });
foodItemSchema.index({ category: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema, 'food_items');

module.exports = FoodItem;
