const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên món ăn không được để trống'],
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
      required: [true, 'Calo/100g không được để trống'],
      min: [0, 'Calo không được âm'],
    },
    protein_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Đạm không được âm'],
    },
    carb_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Đường bột không được âm'],
    },
    fat_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Chất béo không được âm'],
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
    timestamps: false,
    collection: 'food_items',
  }
);

foodItemSchema.index({ name: 'text', aliases: 'text' });
foodItemSchema.index({ category: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
