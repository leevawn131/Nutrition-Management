const FoodItem = require('../models/food_item.model');

const INITIAL_FOOD_ITEMS = [
  {
    name: 'Sữa bột gầy có bổ sung Vitamin A và D',
    name_en: 'Milk, dry, nonfat, regular, with added vitamin A and vitamin D',
    category: 'Sữa & Sản phẩm từ sữa',
    calories_per_100g: 359,
    protein_per_100g: 36.2,
    carb_per_100g: 52.0,
    fat_per_100g: 0.8,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
    is_verified: true,
    aliases: ['sữa bột gầy', 'nonfat milk powder', 'sữa tách béo vitamin A D'],
  },
  {
    name: 'Sữa chua trái cây ít béo giàu đạm bổ sung Vitamin D',
    name_en: 'Yogurt, fruit, low fat, 10 grams protein per 8 ounce, fortified with vitamin D',
    category: 'Sữa chua & Tráng miệng',
    calories_per_100g: 95,
    protein_per_100g: 4.4,
    carb_per_100g: 17.5,
    fat_per_100g: 1.1,
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
    is_verified: true,
    aliases: ['sữa chua trái cây', 'fruit yogurt', 'yogurt low fat'],
  },
  {
    name: 'Sữa đậu nành không béo, bổ sung Canxi và vitamin A, D',
    name_en: 'Soymilk (all flavors), nonfat, with added calcium, vitamins A and D',
    category: 'Sữa hạt & Đậu',
    calories_per_100g: 33,
    protein_per_100g: 2.9,
    carb_per_100g: 4.1,
    fat_per_100g: 0.2,
    image_url: 'https://images.unsplash.com/photo-1564844536311-de546a28c87d',
    is_verified: true,
    aliases: ['sữa đậu nành', 'soymilk nonfat', 'sữa đậu nành canxi'],
  },
  {
    name: 'Sữa bột gầy hòa tan không bổ sung vitamin A và D',
    name_en: 'Milk, dry, nonfat, instant, without added vitamin A and vitamin D',
    category: 'Sữa & Sản phẩm từ sữa',
    calories_per_100g: 357,
    protein_per_100g: 35.1,
    carb_per_100g: 52.2,
    fat_per_100g: 0.7,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
    is_verified: true,
    aliases: ['sữa bột gầy hòa tan', 'instant dry milk'],
  },
  {
    name: 'Bơ thực vật dạng thanh, (60% béo, có muối, bổ sung Vitamin D)',
    name_en: 'Margarine-like, vegetable oil spread, 60% fat, stick, with salt, with added vitamin D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 535,
    protein_per_100g: 0.2,
    carb_per_100g: 0.5,
    fat_per_100g: 60.0,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
    is_verified: true,
    aliases: ['bơ thực vật', 'margarine 60%', 'bơ thanh'],
  },
  {
    name: 'Bơ thực vật dạng thanh có muối, (80% chất béo, bổ sung Vitamin D)',
    name_en: 'Margarine, regular, 80% fat, composite, stick, with salt, with added vitamin D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 717,
    protein_per_100g: 0.9,
    carb_per_100g: 0.9,
    fat_per_100g: 80.5,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
    is_verified: true,
    aliases: ['bơ thực vật 80%', 'margarine regular', 'bơ mặn'],
  },
  {
    name: 'Bơ thực vật dạng thanh không muối, (80% chất béo, bổ sung Vitamin D)',
    name_en: 'Margarine, regular, 80% fat, composite, stick, without salt, with added vitamin D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 717,
    protein_per_100g: 0.9,
    carb_per_100g: 0.9,
    fat_per_100g: 80.5,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
    is_verified: true,
    aliases: ['bơ thực vật lạt', 'margarine unsalted'],
  },
  {
    name: 'Ức gà phi lê tươi',
    name_en: 'Fresh Chicken Breast Fillet',
    category: 'Thịt & Gia cầm',
    calories_per_100g: 165,
    protein_per_100g: 31.0,
    carb_per_100g: 0.0,
    fat_per_100g: 3.6,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
    is_verified: true,
    aliases: ['ức gà', 'uc ga', 'thịt gà'],
  },
  {
    name: 'Cá hồi tươi phi lê',
    name_en: 'Fresh Atlantic Salmon Fillet',
    category: 'Hải sản',
    calories_per_100g: 208,
    protein_per_100g: 20.4,
    carb_per_100g: 0.0,
    fat_per_100g: 13.4,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    is_verified: true,
    aliases: ['cá hồi', 'salmon', 'ca hoi'],
  },
  {
    name: 'Trứng gà tươi',
    name_en: 'Fresh Whole Chicken Eggs',
    category: 'Trứng & Bơ sữa',
    calories_per_100g: 143,
    protein_per_100g: 12.6,
    carb_per_100g: 0.8,
    fat_per_100g: 9.5,
    image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f',
    is_verified: true,
    aliases: ['trứng gà', 'trung ga', 'egg'],
  },
  {
    name: 'Yến mạch cán dẹt',
    name_en: 'Rolled Oats',
    category: 'Ngũ cốc & Hạt',
    calories_per_100g: 389,
    protein_per_100g: 16.9,
    carb_per_100g: 66.3,
    fat_per_100g: 6.9,
    image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
    is_verified: true,
    aliases: ['yến mạch', 'yen mach', 'oats'],
  },
  {
    name: 'Hạt chia hữu cơ',
    name_en: 'Organic Chia Seeds',
    category: 'Ngũ cốc & Hạt',
    calories_per_100g: 486,
    protein_per_100g: 16.5,
    carb_per_100g: 42.1,
    fat_per_100g: 30.7,
    image_url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55',
    is_verified: true,
    aliases: ['hạt chia', 'hat chia', 'chia seeds'],
  },
  {
    name: 'Quả bơ sáp Đắk Lắk',
    name_en: 'Fresh Ripe Avocado',
    category: 'Trái cây & Rau củ',
    calories_per_100g: 160,
    protein_per_100g: 2.0,
    carb_per_100g: 8.5,
    fat_per_100g: 14.7,
    image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578',
    is_verified: true,
    aliases: ['quả bơ', 'bơ sáp', 'avocado'],
  },
];

/**
 * Service to manage food items / ingredients
 */
class FoodService {
  /**
   * Ensure standard ingredients exist in the database
   */
  async ensureInitialFoods() {
    try {
      const count = await FoodItem.countDocuments();
      if (count < 8) {
        for (const item of INITIAL_FOOD_ITEMS) {
          const exists = await FoodItem.findOne({ name: item.name });
          if (!exists) {
            await FoodItem.create(item);
          }
        }
      }
    } catch (e) {
      // Ignore background init error
    }
  }

  /**
   * Get list of food items with optional search & filtering
   * @param {Object} queryOptions
   * @returns {Promise<Object>}
   */
  async getFoodItems({ search = '', category = '', limit = 50, page = 1 } = {}) {
    await this.ensureInitialFoods();

    const query = {};

    if (category && category.trim()) {
      query.category = new RegExp(category.trim(), 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { name_en: searchRegex },
        { category: searchRegex },
        { aliases: searchRegex },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const items = await FoodItem.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10) || 50)
      .lean();

    const total = await FoodItem.countDocuments(query);

    return {
      items,
      total,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    };
  }

  /**
   * Get food item by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getFoodItemById(id) {
    return await FoodItem.findById(id).lean();
  }
}

module.exports = new FoodService();
