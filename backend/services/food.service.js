const FoodItem = require('../models/food_item.model');

/**
 * Service handling food items directory & search
 */
class FoodService {
  /**
   * Search food items by name or aliases with pagination
   * @param {Object} params
   * @param {string} params.query - Search query string
   * @param {string} params.category - Category filter
   * @param {number} params.page - Page number (1-indexed)
   * @param {number} params.limit - Items per page
   */
  async searchFoods({ query, category, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (category && category !== 'ingredient') {
      filter.category = category;
    }

    let sort = { name: 1 };

    if (query && query.trim() !== '') {
      const trimmedQuery = query.trim();
      const regex = new RegExp(trimmedQuery, 'i');
      filter.$or = [
        { name: regex },
        { aliases: regex },
        { name_en: regex },
      ];
    }

    const [total, foods] = await Promise.all([
      FoodItem.countDocuments(filter),
      FoodItem.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Raw ingredient presets to ensure rich raw ingredient database
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

    // Filter out complete dishes if category is ingredient
    let combinedFoods = foods;
    if (category === 'ingredient' || !query || query.trim() === '') {
      const qLower = (query || '').toLowerCase().trim();
      const filteredRaw = RAW_INGREDIENTS.filter(r => !qLower || r.name.toLowerCase().includes(qLower));
      
      // Filter out non-raw meals like "Cơm tấm", "Phở bò tái", "Bún chả", "Bánh mì"
      const nonRawMealNames = ['phở bò tái', 'bún chả', 'cơm tấm', 'bánh mì kẹp thịt'];
      const rawDbFoods = (foods || []).filter(f => f && f.name && !nonRawMealNames.some(m => String(f.name).toLowerCase().includes(m)));
      
      combinedFoods = [...filteredRaw, ...rawDbFoods];
    }

    return {
      foods: combinedFoods,
      pagination: {
        total: combinedFoods.length,
        page: pageNum,
        limit: limitNum,
        totalPages: 1,
      },
    };
  }

  /**
   * Get single food item by ID
   * @param {string} id
   */
  async getFoodById(id) {
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

    const preset = RAW_INGREDIENTS.find(r => r._id === id);
    if (preset) return preset;

    let food = null;
    try {
      if (FoodItem.collection) {
        food = await FoodItem.collection.findOne({ _id: id });
      }
      if (!food) {
        food = await FoodItem.findOne({ _id: id }).lean();
      }
    } catch (err) {
      console.error('Lỗi getFoodById:', err);
    }

    if (!food) {
      const error = new Error('Không tìm thấy thông tin món ăn');
      error.statusCode = 404;
      throw error;
    }
    return food;
  }
}

module.exports = new FoodService();
