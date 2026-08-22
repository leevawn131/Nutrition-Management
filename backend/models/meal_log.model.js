const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      default: null,
    },
    input_method: {
      type: String,
      enum: ['photo', 'gallery', 'text'],
      required: [true, 'input_method is required'],
      default: 'text',
    },
    source_image_url: {
      type: String,
      default: null,
    },
    description_text: {
      type: String,
      default: null,
    },
    portion_label: {
      type: String,
      enum: ['small', 'medium', 'large', null],
      default: null,
    },
    portion_grams: {
      type: Number,
      default: null,
    },
    calories: {
      type: Number,
      required: [true, 'calories is required'],
    },
    protein_g: {
      type: Number,
      default: 0,
    },
    carb_g: {
      type: Number,
      default: 0,
    },
    fat_g: {
      type: Number,
      default: 0,
    },
    meal_type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'meal_type is required'],
    },
    logged_at: {
      type: Date,
      required: [true, 'logged_at is required'],
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    recognition_summary: {
      recognition_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      predicted_label: {
        type: String,
        default: null,
      },
      confidence: {
        type: Number,
        default: null,
      },
      corrected_label: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: false,
    collection: 'meal_logs',
  }
);

mealLogSchema.index({ user_id: 1, logged_at: -1 });
mealLogSchema.index({ food_item_id: 1 });

const MealLog = mongoose.model('MealLog', mealLogSchema);

module.exports = MealLog;
