const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  unit: { type: String, required: true },
  icon_url: { type: String, default: '' },
});

const StepSchema = new mongoose.Schema({
  step_number: { type: Number, required: true },
  title: { type: String, default: '' },
  description: { type: String, required: true },
});

const ReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_name: { type: String, required: true },
  user_avatar: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  quick_tags: [{ type: String }],
  comment: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    category: { type: String, default: 'Món chính' },
    cover_image_url: { type: String, required: true },
    author: {
      name: { type: String, required: true },
      avatar_url: { type: String, default: '' },
    },
    prep_time_min: { type: Number, default: 10 },
    cook_time_min: { type: Number, default: 15 },
    servings: { type: Number, default: 1 },
    rating: { type: Number, default: 5.0 },
    rating_count: { type: Number, default: 2 },
    saved_count: { type: Number, default: 19 },
    ingredients: [IngredientSchema],
    steps: [StepSchema],
    nutrition_facts: {
      calories: { type: Number, required: true, default: 170 },
      protein_g: { type: Number, required: true, default: 14.1 },
      carb_g: { type: Number, required: true, default: 6.3 },
      fat_g: { type: Number, required: true, default: 9.9 },
      glycemic_load: { type: Number, default: 5 },
      saturated_fat_g: { type: Number, default: 2.0 },
      trans_fat_g: { type: Number, default: 0.1 },
      unsaturated_fat_g: { type: Number, default: 5.5 },
      fiber_g: { type: Number, default: 0.2 },
      cholesterol_mg: { type: Number, default: 47 },
      sodium_mg: { type: Number, default: 141 },
      vitamin_a_ug: { type: Number, default: 13 },
      vitamin_e_mg: { type: Number, default: 1 },
      vitamin_k_ug: { type: Number, default: 0 },
      vitamin_c_mg: { type: Number, default: 7 },
      folic_acid_ug: { type: Number, default: 4 },
      vitamin_b12_ug: { type: Number, default: 1 },
      calcium_mg: { type: Number, default: 42 },
      iron_mg: { type: Number, default: 1 },
      zinc_mg: { type: Number, default: 2 },
      magnesium_mg: { type: Number, default: 25 },
      potassium_mg: { type: Number, default: 264 },
      phosphorus_mg: { type: Number, default: 160 },
    },
    reviews: [ReviewSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Recipe', RecipeSchema);
