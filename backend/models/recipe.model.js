const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredient_name: {
      type: String,
      required: [true, 'Tên nguyên liệu không được để trống'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

const recipeStepSchema = new mongoose.Schema(
  {
    step_number: {
      type: Number,
      required: [true, 'Thứ tự bước không được để trống'],
    },
    instruction: {
      type: String,
      required: [true, 'Nội dung hướng dẫn không được để trống'],
      trim: true,
    },
  },
  { _id: false }
);

const recipeNutritionFactsSchema = new mongoose.Schema(
  {
    energy_kcal: { type: Number, default: null },
    protein_g: { type: Number, default: null },
    carbohydrate_g: { type: Number, default: null },
    fat_g: { type: Number, default: null },
    fiber_g: { type: Number, default: null },
    saturated_fat_g: { type: Number, default: null },
    trans_fat_g: { type: Number, default: null },
    unsaturated_fat_g: { type: Number, default: null },
    cholesterol_mg: { type: Number, default: null },
    salt_g: { type: Number, default: null },
    sodium_mg: { type: Number, default: null },
    glycemic_load: { type: Number, default: null },
    vitamin_a_mcg: { type: Number, default: null },
    vitamin_d_mcg: { type: Number, default: null },
    vitamin_e_mg: { type: Number, default: null },
    vitamin_k_mcg: { type: Number, default: null },
    vitamin_c_mg: { type: Number, default: null },
    vitamin_b12_mcg: { type: Number, default: null },
    folic_acid_mcg: { type: Number, default: null },
    calcium_mg: { type: Number, default: null },
    iron_mg: { type: Number, default: null },
    zinc_mg: { type: Number, default: null },
    magnesium_mg: { type: Number, default: null },
    potassium_mg: { type: Number, default: null },
    phosphorus_mg: { type: Number, default: null },
    updated_at: { type: Date, default: null },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên công thức không được để trống'],
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
    prep_time_minutes: {
      type: Number,
      default: null,
    },
    cook_time_minutes: {
      type: Number,
      default: null,
    },
    servings: {
      type: Number,
      required: [true, 'Khẩu phần không được để trống'],
      default: 1,
      min: [0.1, 'Khẩu phần phải lớn hơn 0'],
    },
    calories_per_serving: {
      type: Number,
      default: null,
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
    avg_rating: {
      type: Number,
      default: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
    },
    source_type: {
      type: String,
      enum: ['system', 'community'],
      required: true,
      default: 'system',
    },
    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    ingredients: {
      type: [recipeIngredientSchema],
      default: [],
    },
    steps: {
      type: [recipeStepSchema],
      default: [],
    },
    nutrition_facts: {
      type: recipeNutritionFactsSchema,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'recipes',
  }
);

recipeSchema.index({ title: 'text' });
recipeSchema.index({ source_type: 1, status: 1 });
recipeSchema.index({ created_by_user_id: 1 });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
