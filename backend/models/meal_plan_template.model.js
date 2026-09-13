const mongoose = require("mongoose");

const MealPlanTemplateItemSchema = new mongoose.Schema(
  {
    meal_type: {
      type: String,
      enum: {
        values: ["breakfast", "lunch", "dinner", "snack"],
        message: "meal_type chỉ có thể là breakfast, lunch, dinner hoặc snack",
      },
      required: [true, "Loại bữa ăn (meal_type) là bắt buộc"],
    },
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
    },
    food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      default: null,
    },
    day_number: {
      type: Number,
      default: 1,
    },
    quantity_text: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: true },
);

const MealPlanTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên thực đơn mẫu là bắt buộc"],
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
      trim: true,
    },
    duration_days: {
      type: Number,
      default: 1,
      min: 1,
    },
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: {
      type: [MealPlanTemplateItemSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "meal_plan_templates",
    timestamps: false,
    versionKey: false,
  },
);

MealPlanTemplateSchema.index({ created_by_admin_id: 1 });
MealPlanTemplateSchema.index({ name: "text" });

const MealPlanTemplate =
  mongoose.models.MealPlanTemplate ||
  mongoose.model("MealPlanTemplate", MealPlanTemplateSchema);

module.exports = MealPlanTemplate;
