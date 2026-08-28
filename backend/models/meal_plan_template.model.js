const mongoose = require('mongoose');

const MealPlanTemplateItemSchema = new mongoose.Schema(
  {
    meal_type: {
      type: String,
      enum: {
        values: ['breakfast', 'lunch', 'dinner', 'snack'],
        message: 'meal_type chỉ có thể là breakfast, lunch, dinner hoặc snack',
      },
      required: [true, 'Loại bữa ăn (meal_type) là bắt buộc'],
    },
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'recipe_id là bắt buộc'],
    },
  },
  { _id: false }
);

const MealPlanTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thực đơn mẫu là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'created_by_admin_id là bắt buộc'],
    },
    items: {
      type: [MealPlanTemplateItemSchema],
      default: [],
    },
  },
  {
    collection: 'meal_plan_templates',
    timestamps: false,
    versionKey: false,
  }
);

MealPlanTemplateSchema.index({ created_by_admin_id: 1 });

const MealPlanTemplate =
  mongoose.models.MealPlanTemplate ||
  mongoose.model('MealPlanTemplate', MealPlanTemplateSchema);

module.exports = MealPlanTemplate;
