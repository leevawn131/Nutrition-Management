const Recipe = require('../models/recipe.model');
const FoodItem = require('../models/food_item.model');
const Post = require('../models/post.model');
const User = require('../models/user.model');
const postService = require('./post.service');

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

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

class SearchService {
  /**
   * Search across 4 categories based on query parameter 'tab'
   * @param {string} q - Search query string
   * @param {string} tab - 'recipes' | 'ingredients' | 'posts' | 'users'
   * @param {string} userId - Current authenticated user ID (optional)
   */
  async search({ q = '', tab = 'recipes', userId = null }) {
    const queryStr = (q || '').trim();
    const regex = queryStr ? new RegExp(escapeRegex(queryStr), 'i') : null;

    switch (tab) {
      case 'recipes': {
        const filter = { status: 'approved' };
        if (regex) {
          filter.$or = [{ title: regex }, { description: regex }];
        }
        const recipes = await Recipe.find(filter)
          .sort({ created_at: -1 })
          .limit(30)
          .lean();

        return recipes.map((r) => ({
          id: r._id,
          _id: r._id,
          title: r.title,
          description: r.description || '',
          image_url: r.image_url || null,
          prep_time_minutes: r.prep_time_minutes || 0,
          cook_time_minutes: r.cook_time_minutes || 0,
          total_time_minutes: (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0),
          ingredient_count: (r.ingredients || []).length,
          calories_per_serving: r.calories_per_serving || 0,
          avg_rating: r.avg_rating || 0,
        }));
      }

      case 'ingredients': {
        const filter = {};
        if (regex) {
          filter.$or = [{ name: regex }, { name_en: regex }, { aliases: regex }];
        }
        const foodItems = await FoodItem.find(filter)
          .sort({ is_verified: -1, name: 1 })
          .limit(30)
          .lean();

        // Also match preset raw ingredients (supports Vietnamese with and without tones)
        const qLower = queryStr.toLowerCase();
        const qNoTone = removeVietnameseTones(qLower);
        const matchedPresets = RAW_INGREDIENTS.filter((r) => {
          if (!qLower) return true;
          const rLower = r.name.toLowerCase();
          const rNoTone = removeVietnameseTones(rLower);
          const cLower = (r.category || '').toLowerCase();
          const cNoTone = removeVietnameseTones(cLower);
          return (
            rLower.includes(qLower) ||
            rNoTone.includes(qNoTone) ||
            cLower.includes(qLower) ||
            cNoTone.includes(qNoTone)
          );
        });

        const seen = new Set();
        const results = [];

        for (const item of [...matchedPresets, ...foodItems]) {
          const key = item.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              id: item._id,
              _id: item._id,
              name: item.name,
              name_en: item.name_en || null,
              category: item.category || null,
              calories_per_100g: item.calories_per_100g || 0,
              protein_per_100g: item.protein_per_100g || 0,
              carb_per_100g: item.carb_per_100g || 0,
              fat_per_100g: item.fat_per_100g || 0,
              image_url: item.image_url || null,
            });
          }
        }

        return results;
      }

      case 'posts': {
        const filter = { status: 'visible' };
        if (regex) {
          filter.content = regex;
        }
        const posts = await Post.find(filter)
          .sort({ created_at: -1 })
          .limit(30)
          .populate('user_id', 'full_name avatar_url email')
          .populate('recipe_id', 'title image_url prep_time_minutes cook_time_minutes ingredients steps calories_per_serving protein_g carb_g fat_g')
          .lean();

        return Promise.all(
          posts.map(async (p) => {
            return postService.formatPost(p, userId);
          })
        );
      }

      case 'users': {
        const filter = {};
        if (regex) {
          filter.$or = [{ full_name: regex }, { email: regex }];
        }
        const users = await User.find(filter)
          .select('full_name avatar_url email role created_at')
          .limit(30)
          .lean();

        return users.map((u) => ({
          id: u._id,
          _id: u._id,
          full_name: u.full_name || (u.email ? u.email.split('@')[0] : 'Người dùng'),
          avatar_url: u.avatar_url || null,
          email: u.email,
        }));
      }

      default:
        return [];
    }
  }
}

module.exports = new SearchService();
