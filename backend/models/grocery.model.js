const mongoose = require('mongoose');

const GroceryItemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipe_title: { type: String, default: '' },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  unit: { type: String, required: true },
  checked: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroceryItem', GroceryItemSchema);
