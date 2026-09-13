const mongoose = require('mongoose');

const GroceryItemSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    recipe_title: { type: String, default: '' },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true },
    checked: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: 'grocery_items',
  }
);

GroceryItemSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.models.GroceryItem || mongoose.model('GroceryItem', GroceryItemSchema, 'grocery_items');
