const mongoose = require('mongoose');

const mealPlanTemplateItemSchema = new mongoose.Schema(
  {
    meal_type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'meal_type is required'],
    },
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      default: null,
    },
    day_number: {
      type: Number,
      default: 1,
    },
    quantity_text: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);

const mealPlanTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thực đơn mẫu không được để trống'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    image_url: {
      type: String,
      default: null,
    },
    duration_days: {
      type: Number,
      default: 1,
    },
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: {
      type: [mealPlanTemplateItemSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'meal_plan_templates',
  }
);

mealPlanTemplateSchema.index({ name: 'text' });

const MealPlanTemplate = mongoose.model('MealPlanTemplate', mealPlanTemplateSchema);

module.exports = MealPlanTemplate;
