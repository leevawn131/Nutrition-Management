const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên món ăn là bắt buộc'],
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
      required: [true, 'Lượng calo/100g là bắt buộc'],
      min: [0, 'Calo không thể âm'],
    },
    protein_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Protein không thể âm'],
    },
    carb_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Carb không thể âm'],
    },
    fat_per_100g: {
      type: Number,
      default: null,
      min: [0, 'Fat không thể âm'],
    },
    image_url: {
      type: String,
      default: null,
      trim: true,
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
    collection: 'food_items',
    timestamps: false,
    versionKey: false,
  }
);

FoodItemSchema.index({ name: 'text', aliases: 'text' });
FoodItemSchema.index({ category: 1 });

const FoodItem = mongoose.models.FoodItem || mongoose.model('FoodItem', FoodItemSchema);

module.exports = FoodItem;
