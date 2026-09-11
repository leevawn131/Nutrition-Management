require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const FoodItem = require('../models/food_item.model');
const Recipe = require('../models/recipe.model');
const RecipeComment = require('../models/recipe_comment.model');

const sampleFoods = [
  {
    name: 'Phở bò tái',
    name_en: 'Beef Pho with Rare Beef',
    category: 'Món nước',
    calories_per_100g: 115.0,
    protein_per_100g: 7.5,
    carb_per_100g: 16.2,
    fat_per_100g: 2.8,
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43',
    is_verified: true,
    aliases: ['phở bò', 'phở tái', 'pho bo tai', 'phở bò tái chín'],
  },
  {
    name: 'Cơm tấm sườn nướng',
    name_en: 'Broken Rice with Grilled Pork Chop',
    category: 'Món cơm',
    calories_per_100g: 185.0,
    protein_per_100g: 8.2,
    carb_per_100g: 24.5,
    fat_per_100g: 6.0,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    is_verified: true,
    aliases: ['cơm tấm sườn', 'com tam suon nuong', 'cơm sườn'],
  },
  {
    name: 'Ức gà luộc / áp chảo',
    name_en: 'Boiled / Pan-seared Chicken Breast',
    category: 'Thịt & Gia cầm',
    calories_per_100g: 165.0,
    protein_per_100g: 31.0,
    carb_per_100g: 0.0,
    fat_per_100g: 3.6,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
    is_verified: true,
    aliases: ['ức gà', 'uc ga luoc', 'thịt ức gà', 'chicken breast'],
  },
  {
    name: 'Salad cá hồi sốt mè rang',
    name_en: 'Salmon Salad with Roasted Sesame Dressing',
    category: 'Salad & Eat Clean',
    calories_per_100g: 135.0,
    protein_per_100g: 11.0,
    carb_per_100g: 5.5,
    fat_per_100g: 7.8,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    is_verified: true,
    aliases: ['salad cá hồi', 'salad ca hoi', 'salmon salad'],
  },
  {
    name: 'Bún chả Hà Nội',
    name_en: 'Hanoi Grilled Pork with Rice Noodles',
    category: 'Món nước / Bún',
    calories_per_100g: 160.0,
    protein_per_100g: 7.8,
    carb_per_100g: 20.1,
    fat_per_100g: 5.4,
    image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae',
    is_verified: true,
    aliases: ['bún chả', 'bun cha ha noi', 'bún thịt nướng hà nội'],
  },
  {
    name: 'Bánh mì kẹp thịt',
    name_en: 'Vietnamese Pork Banh Mi',
    category: 'Món ăn nhanh',
    calories_per_100g: 245.0,
    protein_per_100g: 9.5,
    carb_per_100g: 32.0,
    fat_per_100g: 8.5,
    image_url: 'https://images.unsplash.com/photo-1626804475297-41608e074eb1',
    is_verified: true,
    aliases: ['bánh mì', 'banh mi', 'bánh mì thịt'],
  },
  {
    name: 'Thịt bò luộc / hấp',
    name_en: 'Boiled Beef',
    category: 'Thịt & Gia cầm',
    calories_per_100g: 250.0,
    protein_per_100g: 26.0,
    carb_per_100g: 0.0,
    fat_per_100g: 15.0,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    is_verified: true,
    aliases: ['thịt bò', 'thit bo', 'beef'],
  },
];

const sampleRecipes = [
  {
    title: 'Thịt nạc rim mắm',
    description: 'Món ăn gia đình đậm đà, thơm ngon, cách làm cực đơn giản.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 1,
    calories_per_serving: 170,
    protein_g: 14.1,
    carb_g: 6.3,
    fat_g: 9.9,
    avg_rating: 5.0,
    comment_count: 2,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Thịt lợn nạc', quantity: 70, unit: 'g' },
      { ingredient_name: 'Hành lá', quantity: 10, unit: 'g' },
      { ingredient_name: 'Nước mắm', quantity: 7, unit: 'g' },
      { ingredient_name: 'Đường kính', quantity: 5, unit: 'g' },
      { ingredient_name: 'Tỏi ta', quantity: 1, unit: 'tép' },
      { ingredient_name: 'Dầu ăn', quantity: 5, unit: 'g' },
    ],
    steps: [
      { step_number: 1, instruction: 'Thịt lợn rửa sạch, thái miếng vừa ăn chừng 0.5cm.' },
      { step_number: 2, instruction: 'Ướp thịt với tỏi băm, nước mắm, đường và dầu ăn trong 10 phút.' },
      { step_number: 3, instruction: 'Bắc chảo lên bếp, cho thịt vào đảo đều cho săn lại. Thêm 30g nước lọc, đun lửa nhỏ cho đến khi nước sốt sánh mịn.' },
      { step_number: 4, instruction: 'Rắc hành lá thái nhỏ lên trên, tắt bếp và trình bày ra đĩa.' },
    ],
    nutrition_facts: {
      energy_kcal: 170,
      protein_g: 14.1,
      carbohydrate_g: 6.3,
      fat_g: 9.9,
      glycemic_load: 5,
      saturated_fat_g: 2.0,
      trans_fat_g: 0.1,
      unsaturated_fat_g: 5.5,
      fiber_g: 0.2,
      cholesterol_mg: 47,
      sodium_mg: 141,
    },
  },
  {
    title: 'Ức gà áp chảo sốt chanh leo Eat Clean',
    description: 'Món ăn giàu đạm, ít béo, sốt chanh leo chua ngọt thơm ngon không bị khô.',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    servings: 2,
    calories_per_serving: 320,
    protein_g: 42.0,
    carb_g: 12.0,
    fat_g: 6.5,
    avg_rating: 4.8,
    comment_count: 1,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Ức gà phi lê', quantity: 300, unit: 'g' },
      { ingredient_name: 'Chanh leo (chanh dây)', quantity: 2, unit: 'quả' },
      { ingredient_name: 'Mật ong nguyên chất', quantity: 1, unit: 'muỗng canh' },
      { ingredient_name: 'Dầu ô liu', quantity: 5, unit: 'ml' },
    ],
    steps: [
      { step_number: 1, instruction: 'Ức gà rửa sạch, khía vảy rồng, ướp với chút muối, tiêu và tỏi băm trong 10 phút.' },
      { step_number: 2, instruction: 'Chanh leo lọc lấy nước cốt, khuấy đều với 1 muỗng mật ong và 2 muỗng nước lọc.' },
      { step_number: 3, instruction: 'Làm nóng chảo với dầu ô liu, áp chảo ức gà mỗi mặt 4-5 phút đến khi vàng đều.' },
      { step_number: 4, instruction: 'Đổ sốt chanh leo vào chảo đun nhỏ lửa 2 phút cho sốt sệt lại và ngấm vào gà.' },
    ],
    nutrition_facts: {
      energy_kcal: 320,
      protein_g: 42.0,
      carbohydrate_g: 12.0,
      fat_g: 6.5,
      glycemic_load: 4,
      saturated_fat_g: 1.2,
      trans_fat_g: 0.0,
      unsaturated_fat_g: 4.8,
      fiber_g: 2.1,
    },
  },
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_app';
    console.log('⏳ Đang kết nối tới MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('🗑️ Làm sạch dữ liệu cũ...');
    await FoodItem.deleteMany({});
    await Recipe.deleteMany({});
    await RecipeComment.deleteMany({});

    console.log('🌱 Đang nạp dữ liệu danh mục food_items...');
    await FoodItem.insertMany(sampleFoods);

    // Hash default passwords for test users
    const userPasswordHash = await bcrypt.hash('User1@123', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const customPasswordHash = await bcrypt.hash('123456', 10);

    const sampleUsers = [
      {
        email: 'nguyenvanan@gmail.com',
        password_hash: userPasswordHash,
        full_name: 'Nguyễn Văn An',
        gender: 'male',
        role: 'user',
        target_calories: 1800,
      },
      {
        email: 'otakusang2005@gmail.com',
        password_hash: customPasswordHash,
        full_name: 'Otaku Sang',
        gender: 'male',
        role: 'user',
        target_calories: 2000,
      },
      {
        email: 'admin@nutrition.app',
        password_hash: adminPasswordHash,
        full_name: 'Quản trị viên Hệ thống',
        gender: 'male',
        role: 'admin',
        target_calories: 2200,
      },
    ];

    let firstUserDoc = null;
    for (const u of sampleUsers) {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true, new: true }
      );
      if (!firstUserDoc) firstUserDoc = doc;
    }

    console.log('🍲 Đang nạp dữ liệu công thức recipes...');
    for (const r of sampleRecipes) {
      r.created_by_user_id = firstUserDoc ? firstUserDoc._id : null;
      const createdRecipe = await Recipe.create(r);

      // Add sample comment
      if (firstUserDoc) {
        await RecipeComment.create({
          recipe_id: createdRecipe._id,
          user_id: firstUserDoc._id,
          rating: 5,
          content: 'Món ăn rất vừa vị, rim mặn ngọt đậm đà chuẩn vị cơm nhà!',
          status: 'visible',
        });
      }
    }

    console.log('✅ Nạp dữ liệu seed thành công (Food items, Users & Recipes)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
