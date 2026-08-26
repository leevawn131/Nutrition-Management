const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    meals: [
      {
        type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
        name: String,
        calories: Number,
        recipe: String,
        ingredients: [String]
      }
    ],
    totalCalories: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);