const mongoose = require("mongoose");

const RecipeIngredientSchema = new mongoose.Schema(
  {
    ingredient_name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: null,
      min: 0,
    },
    unit: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const RecipeStepSchema = new mongoose.Schema(
  {
    step_number: {
      type: Number,
      required: true,
      min: 1,
    },
    instruction: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const RecipeNutritionFactsSchema = new mongoose.Schema(
  {
    energy_kcal: { type: Number, default: null, min: 0 },
    protein_g: { type: Number, default: null, min: 0 },
    carbohydrate_g: { type: Number, default: null, min: 0 },
    fat_g: { type: Number, default: null, min: 0 },
    fiber_g: { type: Number, default: null, min: 0 },
    saturated_fat_g: { type: Number, default: null, min: 0 },
    trans_fat_g: { type: Number, default: null, min: 0 },
    unsaturated_fat_g: { type: Number, default: null, min: 0 },
    cholesterol_mg: { type: Number, default: null, min: 0 },
    salt_g: { type: Number, default: null, min: 0 },
    sodium_mg: { type: Number, default: null, min: 0 },
    glycemic_load: { type: Number, default: null, min: 0 },
    vitamin_a_mcg: { type: Number, default: null, min: 0 },
    vitamin_d_mcg: { type: Number, default: null, min: 0 },
    vitamin_e_mg: { type: Number, default: null, min: 0 },
    vitamin_k_mcg: { type: Number, default: null, min: 0 },
    vitamin_c_mg: { type: Number, default: null, min: 0 },
    vitamin_b12_mcg: { type: Number, default: null, min: 0 },
    folic_acid_mcg: { type: Number, default: null, min: 0 },
    calcium_mg: { type: Number, default: null, min: 0 },
    iron_mg: { type: Number, default: null, min: 0 },
    zinc_mg: { type: Number, default: null, min: 0 },
    magnesium_mg: { type: Number, default: null, min: 0 },
    potassium_mg: { type: Number, default: null, min: 0 },
    phosphorus_mg: { type: Number, default: null, min: 0 },
    updated_at: { type: Date, default: null },
  },
  { _id: false },
);

const RecipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tên công thức là bắt buộc"],
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
    prep_time_minutes: {
      type: Number,
      default: null,
      min: 0,
    },
    cook_time_minutes: {
      type: Number,
      default: null,
      min: 0,
    },
    servings: {
      type: Number,
      required: [true, "Khẩu phần là bắt buộc"],
      min: [0.1, "Khẩu phần phải lớn hơn 0"],
    },
    calories_per_serving: {
      type: Number,
      default: null,
      min: 0,
    },
    protein_g: {
      type: Number,
      default: null,
      min: 0,
    },
    carb_g: {
      type: Number,
      default: null,
      min: 0,
    },
    fat_g: {
      type: Number,
      default: null,
      min: 0,
    },
    avg_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    comment_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    source_type: {
      type: String,
      enum: {
        values: ["system", "community"],
        message: "source_type chỉ có thể là system hoặc community",
      },
      required: [true, "Nguồn công thức (source_type) là bắt buộc"],
      default: "system",
    },
    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "status chỉ có thể là pending, approved hoặc rejected",
      },
      required: [true, "Trạng thái (status) là bắt buộc"],
      default: "approved",
    },
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ingredients: {
      type: [RecipeIngredientSchema],
      default: [],
    },
    steps: {
      type: [RecipeStepSchema],
      default: [],
    },
    nutrition_facts: {
      type: RecipeNutritionFactsSchema,
      default: null,
    },
  },
  {
    collection: "recipes",
    timestamps: false,
    versionKey: false,
  },
);

RecipeSchema.index({ title: "text" });
RecipeSchema.index({ source_type: 1, status: 1 });
RecipeSchema.index({ created_by_user_id: 1 });

const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", RecipeSchema);

module.exports = Recipe;
