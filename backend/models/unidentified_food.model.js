const mongoose = require("mongoose");

const unidentifiedFoodSchema = new mongoose.Schema(
  {
    reported_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "reported_by_user_id là bắt buộc"],
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
      enum: {
        values: ["pending", "resolved"],
        message: "Trạng thái phải là pending hoặc resolved",
      },
      default: "pending",
      required: [true, "status là bắt buộc"],
    },
    resolved_food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: [true, "created_at là bắt buộc"],
    },
  },
  {
    collection: "unidentified_foods",
    timestamps: false,
    versionKey: false,
  },
);

// Indexes matching database/mongodb-setup.js exactly
unidentifiedFoodSchema.index({ status: 1 });
unidentifiedFoodSchema.index({ reported_by_user_id: 1 });

const UnidentifiedFood = mongoose.model(
  "UnidentifiedFood",
  unidentifiedFoodSchema,
);

module.exports = UnidentifiedFood;
