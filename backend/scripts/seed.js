require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const FoodItem = require('../models/food_item.model');

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

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_app';
    console.log('⏳ Đang kết nối tới MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('🗑️ Làm sạch dữ liệu cũ...');
    await FoodItem.deleteMany({});

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

    for (const u of sampleUsers) {
      await User.updateOne(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true }
      );
    }

    console.log('✅ Nạp dữ liệu seed thành công (Food items & Users)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
