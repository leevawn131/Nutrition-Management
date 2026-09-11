const FoodItem = require('../models/food_item.model');

const RAW_INGREDIENTS = [
  { _id: 'ing_ucga', name: 'Ức gà / Thịt gà thô', category: 'Thịt & Gia cầm', calories_per_100g: 165, protein_per_100g: 31, carb_per_100g: 0, fat_per_100g: 3.6, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200' },
  { _id: 'ing_thitbo', name: 'Thịt bò nạc thô', category: 'Thịt & Gia cầm', calories_per_100g: 250, protein_per_100g: 26, carb_per_100g: 0, fat_per_100g: 15, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200' },
  { _id: 'ing_thitlon', name: 'Thịt lợn nạc', category: 'Thịt & Gia cầm', calories_per_100g: 143, protein_per_100g: 20.3, carb_per_100g: 0, fat_per_100g: 6.2, image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=200' },
  { _id: 'ing_cahoi', name: 'Cá hồi tươi', category: 'Hải sản', calories_per_100g: 208, protein_per_100g: 20, carb_per_100g: 0, fat_per_100g: 13, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200' },
  { _id: 'ing_trung', name: 'Trứng gà tươi', category: 'Trứng & Sữa', calories_per_100g: 155, protein_per_100g: 13, carb_per_100g: 1.1, fat_per_100g: 11, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200' },
  { _id: 'ing_banhpho', name: 'Bánh phở tươi', category: 'Tinh bột', calories_per_100g: 140, protein_per_100g: 2.2, carb_per_100g: 31, fat_per_100g: 0.3, image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200' },
  { _id: 'ing_raubina', name: 'Rau bina / Cải bó xôi', category: 'Rau củ', calories_per_100g: 23, protein_per_100g: 2.9, carb_per_100g: 3.6, fat_per_100g: 0.4, image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200' },
  { _id: 'ing_hanhla', name: 'Hành lá', category: 'Rau củ', calories_per_100g: 32, protein_per_100g: 1.8, carb_per_100g: 7.3, fat_per_100g: 0.2, image_url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=200' },
  { _id: 'ing_toi', name: 'Tỏi củ', category: 'Gia vị', calories_per_100g: 149, protein_per_100g: 6.4, carb_per_100g: 33, fat_per_100g: 0.5, image_url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=200' },
  { _id: 'ing_nuocmam', name: 'Nước mắm', category: 'Gia vị', calories_per_100g: 35, protein_per_100g: 5.1, carb_per_100g: 3.6, fat_per_100g: 0, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200' },
];

class FoodService {
  /**
   * Get list of food items with optional search and pagination
   */
  async getFoodItems({ search = '', query = '', q = '', category = '', limit = 20, page = 1 } = {}) {
    const searchText = (search || query || q || '').trim();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (category && category !== 'Tất cả' && category !== 'ingredient') {
      filter.category = new RegExp(category.trim(), 'i');
    }
    if (searchText) {
      filter.$or = [
        { name: new RegExp(searchText, 'i') },
        { name_en: new RegExp(searchText, 'i') },
        { aliases: new RegExp(searchText, 'i') },
      ];
    }

    let [total, items] = await Promise.all([
      FoodItem.countDocuments(filter),
      FoodItem.find(filter)
        .sort({ is_verified: -1, name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // If looking for ingredients or raw foods, prepend preset RAW_INGREDIENTS if matching
    if (category === 'ingredient' || (!category && !searchText)) {
      const qLower = searchText.toLowerCase();
      const matchedPresets = RAW_INGREDIENTS.filter(
        (r) => !qLower || r.name.toLowerCase().includes(qLower) || r.category.toLowerCase().includes(qLower)
      );
      items = [...matchedPresets, ...items];
      total = items.length;
    }

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      foods: items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Alias for searchFoods (used by Sang's mobile screens)
   */
  async searchFoods(params) {
    return await this.getFoodItems(params);
  }

  /**
   * Get food item by ID
   */
  async getFoodItemById(id) {
    if (!id) return null;

    // Check presets first
    const preset = RAW_INGREDIENTS.find((r) => r._id === id);
    if (preset) return preset;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      return await FoodItem.findById(id).lean();
    }
    return await FoodItem.findOne({ _id: id }).lean();
  }

  /**
   * Alias for getFoodById
   */
  async getFoodById(id) {
    const item = await this.getFoodItemById(id);
    if (!item) {
      const error = new Error('Không tìm thấy thông tin món ăn');
      error.statusCode = 404;
      throw error;
    }
    return item;
  }
}

module.exports = new FoodService();
