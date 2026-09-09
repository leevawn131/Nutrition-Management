const mongoose = require('mongoose');

const RecipeIngredientSchema = new mongoose.Schema(
  {
    ingredient_name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: '' },
  },
  { _id: false }
);

const RecipeStepSchema = new mongoose.Schema(
  {
    step_number: { type: Number, required: true },
    instruction: { type: String, required: true },
    image_url: { type: String, default: '' },
  },
  { _id: false }
);

const NutritionFactsSchema = new mongoose.Schema(
  {
    energy_kcal: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbohydrate_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    saturated_fat_g: { type: Number, default: 0 },
    trans_fat_g: { type: Number, default: 0 },
    unsaturated_fat_g: { type: Number, default: 0 },
    cholesterol_mg: { type: Number, default: 0 },
    salt_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    glycemic_load: { type: Number, default: 0 },
    vitamin_a_mcg: { type: Number, default: 0 },
    vitamin_d_mcg: { type: Number, default: 0 },
    vitamin_e_mg: { type: Number, default: 0 },
    vitamin_k_mcg: { type: Number, default: 0 },
    vitamin_c_mg: { type: Number, default: 0 },
    vitamin_b12_mcg: { type: Number, default: 0 },
    folic_acid_mcg: { type: Number, default: 0 },
    calcium_mg: { type: Number, default: 0 },
    iron_mg: { type: Number, default: 0 },
    zinc_mg: { type: Number, default: 0 },
    magnesium_mg: { type: Number, default: 0 },
    potassium_mg: { type: Number, default: 0 },
    phosphorus_mg: { type: Number, default: 0 },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image_url: { type: String, default: '' },
    prep_time_minutes: { type: Number, default: 0 },
    cook_time_minutes: { type: Number, default: 0 },
    servings: { type: Number, required: true, default: 1 },
    calories_per_serving: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carb_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    avg_rating: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    source_type: { type: String, enum: ['system', 'community'], default: 'community' },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    ingredients: [RecipeIngredientSchema],
    steps: [RecipeStepSchema],
    nutrition_facts: { type: NutritionFactsSchema, default: () => ({}) },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Recipe', RecipeSchema);
