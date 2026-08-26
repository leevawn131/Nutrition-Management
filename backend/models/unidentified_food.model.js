const mongoose = require('mongoose');

const unidentifiedFoodSchema = new mongoose.Schema(
  {
    reported_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'reported_by_user_id is required'],
    },
    image_url: {
      type: String,
      default: null,
    },
    name_guess: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
    resolved_food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'unidentified_foods',
  }
);

// Indexes defined in database/mongodb-setup.js
unidentifiedFoodSchema.index({ status: 1 });
unidentifiedFoodSchema.index({ reported_by_user_id: 1 });

const UnidentifiedFood = mongoose.model('UnidentifiedFood', unidentifiedFoodSchema);

module.exports = UnidentifiedFood;
