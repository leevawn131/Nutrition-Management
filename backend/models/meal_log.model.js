const mongoose = require('mongoose');

// Embedded Summary for recognition if logged from AI
const recognitionSummarySchema = new mongoose.Schema(
  {
    recognition_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecognitionHistory',
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
  { _id: false }
);

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
    meal_type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'meal_type is required'],
    },
    logged_at: {
      type: Date,
      required: [true, 'logged_at is required'],
    },
    recognition_summary: {
      type: recognitionSummarySchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'meal_logs',
  }
);

// Indexes defined in database/mongodb-setup.js
mealLogSchema.index({ user_id: 1, logged_at: -1 });
mealLogSchema.index({ food_item_id: 1 });

const MealLog = mongoose.model('MealLog', mealLogSchema);

module.exports = MealLog;
