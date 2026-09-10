const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    plan_date: {
      type: Date,
      required: [true, 'plan_date is required'],
    },
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
    source: {
      type: String,
      enum: ['template', 'recipe', 'ingredient', 'manual'],
      required: [true, 'source is required'],
      default: 'manual',
    },
    is_logged: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'meal_plans',
  }
);

mealPlanSchema.index({ user_id: 1, plan_date: 1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;
