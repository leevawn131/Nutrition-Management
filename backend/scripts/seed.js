require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const FoodItem = require('../models/food_item.model');
const Recipe = require('../models/recipe.model');
const RecipeComment = require('../models/recipe_comment.model');
const Post = require('../models/post.model');
const UserCollection = require('../models/user_collection.model');

const sampleFoods = [
  {
    name: 'Phở bò tái',
    name_en: 'Beef Pho with Rare Beef',
    category: 'Món nước',
    calories_per_100g: 115.0,
    protein_per_100g: 7.5,
    carb_per_100g: 16.2,
    fat_per_100g: 2.8,
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    is_verified: true,
    aliases: ['ức gà', 'uc ga luoc', 'thịt ức gà', 'chicken breast'],
  },
  {
    name: 'Sữa bột gầy có bổ sung Vitamin A và D',
    name_en: 'Skimmed Milk Powder with Vit A & D',
    category: 'Sữa & Sản phẩm từ sữa',
    calories_per_100g: 360.0,
    protein_per_100g: 35.0,
    carb_per_100g: 52.0,
    fat_per_100g: 1.0,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800',
    is_verified: true,
    aliases: ['sữa bột gầy', 'skimmed milk powder'],
  },
  {
    name: 'Bơ thực vật dạng thanh bổ sung Vitamin D',
    name_en: 'Margarine Stick with Vit D',
    category: 'Bơ & Chất béo',
    calories_per_100g: 540.0,
    protein_per_100g: 0.5,
    carb_per_100g: 1.0,
    fat_per_100g: 60.0,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800',
    is_verified: true,
    aliases: ['bơ thực vật', 'margarine'],
  },
];

const sampleRecipes = [
  {
    title: 'Thịt nạc rim',
    description: 'Món ăn gia đình đậm đà, thơm ngon, cách làm cực đơn giản.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 2,
    calories_per_serving: 320,
    protein_g: 28,
    carb_g: 5,
    fat_g: 18,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Thịt nạc vai', quantity: 300, unit: 'g' },
      { ingredient_name: 'Nước mắm', quantity: 2, unit: 'muỗng canh' },
      { ingredient_name: 'Đường', quantity: 1, unit: 'muỗng canh' },
      { ingredient_name: 'Hành tím, tỏi', quantity: 20, unit: 'g' },
      { ingredient_name: 'Hành lá, tiêu', quantity: 10, unit: 'g' },
      { ingredient_name: 'Dầu ăn', quantity: 1, unit: 'muỗng canh' },
      { ingredient_name: 'Ớt tươi', quantity: 1, unit: 'quả' },
      { ingredient_name: 'Nước màu béo', quantity: 1, unit: 'muỗng cà phê' },
    ],
  },
  {
    title: 'Bún bò Huế',
    description: 'Đặc sản xứ Huế đậm đà chuẩn vị.',
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    prep_time_minutes: 30,
    cook_time_minutes: 120,
    servings: 4,
    calories_per_serving: 550,
    protein_g: 35,
    carb_g: 65,
    fat_g: 16,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Bắp bò', quantity: 400, unit: 'g' },
      { ingredient_name: 'Giò heo', quantity: 300, unit: 'g' },
      { ingredient_name: 'Chả giò Huế', quantity: 200, unit: 'g' },
      { ingredient_name: 'Huyết bò', quantity: 100, unit: 'g' },
      { ingredient_name: 'Sả tươi', quantity: 5, unit: 'củ' },
      { ingredient_name: 'Mắm ruốc Huế', quantity: 3, unit: 'muỗng canh' },
    ],
  },
  {
    title: 'Khoai lang luộc',
    description: 'Món ăn Eat Clean thanh đạm hỗ trợ giảm cân hiệu quả.',
    image_url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800',
    prep_time_minutes: 5,
    cook_time_minutes: 25,
    servings: 1,
    calories_per_serving: 160,
    protein_g: 2,
    carb_g: 37,
    fat_g: 0.3,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Khoai lang mật', quantity: 200, unit: 'g' },
      { ingredient_name: 'Muối tinh', quantity: 2, unit: 'g' },
    ],
  },
  {
    title: 'Cháo yến mạch chuối hạt chia',
    description: 'Bữa sáng lành mạnh giàu xơ và dinh dưỡng.',
    image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800',
    prep_time_minutes: 5,
    cook_time_minutes: 20,
    servings: 1,
    calories_per_serving: 280,
    protein_g: 9,
    carb_g: 48,
    fat_g: 6,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Yến mạch cán vỡ', quantity: 50, unit: 'g' },
      { ingredient_name: 'Chuối chín', quantity: 1, unit: 'quả' },
      { ingredient_name: 'Hạt chia', quantity: 10, unit: 'g' },
      { ingredient_name: 'Sữa tươi không đường', quantity: 150, unit: 'ml' },
      { ingredient_name: 'Mật ong nguyên chất', quantity: 1, unit: 'muỗng cà phê' },
    ],
  },
  {
    title: 'Gà sốt mật ong tỏi',
    description: 'Thịt gà áp chảo thơm lừng lớp sốt mật ong tỏi đậm đà.',
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    servings: 2,
    calories_per_serving: 420,
    protein_g: 38,
    carb_g: 18,
    fat_g: 20,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Đùi gà lọc xương', quantity: 350, unit: 'g' },
      { ingredient_name: 'Mật ong', quantity: 2, unit: 'muỗng canh' },
      { ingredient_name: 'Tỏi băm', quantity: 20, unit: 'g' },
      { ingredient_name: 'Nước tương', quantity: 2, unit: 'muỗng canh' },
      { ingredient_name: 'Vừng rang', quantity: 5, unit: 'g' },
    ],
  },
  {
    title: 'Trà dâu chanh mật ong',
    description: 'Đồ uống thanh nhiệt dải khát thơm lừng quả dâu tươi.',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 1,
    calories_per_serving: 120,
    protein_g: 0.5,
    carb_g: 30,
    fat_g: 0.2,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Dâu tây tươi', quantity: 80, unit: 'g' },
      { ingredient_name: 'Cốt trà nhài', quantity: 150, unit: 'ml' },
      { ingredient_name: 'Chanh vàng', quantity: 2, unit: 'lát' },
      { ingredient_name: 'Mật ong', quantity: 15, unit: 'ml' },
    ],
  },
  {
    title: 'Kem bơ',
    description: 'Món tráng miệng béo ngậy mát lạnh thần thánh.',
    image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    servings: 2,
    calories_per_serving: 290,
    protein_g: 4,
    carb_g: 32,
    fat_g: 17,
    source_type: 'system',
    status: 'approved',
    ingredients: [
      { ingredient_name: 'Bơ sáp dẻo', quantity: 200, unit: 'g' },
      { ingredient_name: 'Kem dừa mát lạnh', quantity: 100, unit: 'g' },
      { ingredient_name: 'Sữa đặc', quantity: 30, unit: 'ml' },
      { ingredient_name: 'Dừa khô vụn', quantity: 10, unit: 'g' },
    ],
  },
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_app';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB để nạp dữ liệu Seed...');

    // Clear old data
    await FoodItem.deleteMany({});
    await Recipe.deleteMany({});
    await RecipeComment.deleteMany({});
    await Post.deleteMany({});
    await UserCollection.deleteMany({});

    console.log('🥦 Đang nạp dữ liệu món ăn food_items...');
    await FoodItem.insertMany(sampleFoods);

    const userPasswordHash = await bcrypt.hash('User@123456', 10);

    const sampleUsers = [
      { email: 'sanghoang@gmail.com', password_hash: userPasswordHash, full_name: 'Sáng Hoàng', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', gender: 'male', role: 'user' },
      { email: 'anni@gmail.com', password_hash: userPasswordHash, full_name: 'anni', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', gender: 'female', role: 'user' },
      { email: 'minhdo@gmail.com', password_hash: userPasswordHash, full_name: 'Minh Đỗ', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', gender: 'male', role: 'user' },
      { email: 'linhdan@gmail.com', password_hash: userPasswordHash, full_name: 'Linh Đan', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', gender: 'female', role: 'user' },
      { email: 'kimhuong@gmail.com', password_hash: userPasswordHash, full_name: 'Kim Hương', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', gender: 'female', role: 'user' },
      { email: 'mimi@gmail.com', password_hash: userPasswordHash, full_name: 'mi mi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', gender: 'female', role: 'user' },
      { email: 'anhlina@gmail.com', password_hash: userPasswordHash, full_name: 'AnɧLINA', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', gender: 'female', role: 'user' },
      { email: 'twinkle@gmail.com', password_hash: userPasswordHash, full_name: 'twinkle', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', gender: 'female', role: 'user' },
      { email: 'bbh@gmail.com', password_hash: userPasswordHash, full_name: 'bbh', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200', gender: 'male', role: 'user' },
      { email: 'nguyendung@gmail.com', password_hash: userPasswordHash, full_name: 'Nguyễn Dung', avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200', gender: 'female', role: 'user' },
      { email: 'uwu@gmail.com', password_hash: userPasswordHash, full_name: 'uwu', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', gender: 'female', role: 'user' },
    ];

    const createdUsers = [];
    for (const u of sampleUsers) {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true, new: true }
      );
      createdUsers.push(doc);
    }

    const userAnni = createdUsers.find(u => u.full_name === 'anni') || createdUsers[0];
    const userMinhDo = createdUsers.find(u => u.full_name === 'Minh Đỗ') || createdUsers[1];
    const userSangHoang = createdUsers.find(u => u.full_name === 'Sáng Hoàng') || createdUsers[0];

    console.log('🍲 Đang nạp dữ liệu công thức recipes...');
    const createdRecipesMap = {};
    for (const r of sampleRecipes) {
      r.created_by_user_id = userAnni._id;
      const createdRecipe = await Recipe.create(r);
      createdRecipesMap[r.title] = createdRecipe;

      // Add initial comment for recipes
      await RecipeComment.create({
        recipe_id: createdRecipe._id,
        user_id: userMinhDo._id,
        rating: 5,
        content: 'Món ăn rất ngon và đâm đà vị chuẩn cơm nhà!',
        status: 'visible',
        created_at: new Date(),
      });
    }

    console.log('📝 Đang nạp dữ liệu bài viết posts cộng đồng...');
    const samplePosts = [
      {
        user_id: userSangHoang._id,
        content: 'Hôm nay mình nấu món Thịt nạc rim thơm ngon chuẩn vị gia đình, chia sẻ công thức cho mọi người cùng thử nhé! 🍲🥩 #thitnacrim #nauan #eatclean',
        recipe_id: createdRecipesMap['Thịt nạc rim']?._id,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 25 * 60 * 1000), // 25p trước
      },
      {
        user_id: userAnni._id,
        content: 'Chia sẻ công thức: Gà sốt mật ong tỏi',
        recipe_id: createdRecipesMap['Gà sốt mật ong tỏi']?._id,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 42 * 60 * 1000), // 42p trước
      },
      {
        user_id: userAnni._id,
        content: 'thèm ăn gàa',
        recipe_id: null,
        status: 'visible',
        images: [
          { image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', display_order: 1 },
          { image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800', display_order: 2 },
        ],
        created_at: new Date(Date.now() - 24 * 3600 * 1000), // 1 ngày trước
      },
      {
        user_id: userMinhDo._id,
        content: 'Thịt gà nấu cà ri',
        recipe_id: createdRecipesMap['Thịt nạc rim']?._id,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 9 * 3600 * 1000), // 9 giờ trước
      },
      {
        user_id: userAnni._id,
        content: 'Chia sẻ công thức: Trà dâu chanh mật ong',
        recipe_id: createdRecipesMap['Trà dâu chanh mật ong']?._id,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 24 * 3600 * 1000), // 1 ngày trước
      },
      {
        user_id: userMinhDo._id,
        content: 'Đã giảm dc cân nha #giảm cân #sức khỏe #thành công',
        recipe_id: null,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 6 * 3600 * 1000), // 6 giờ trước
      },
      {
        user_id: userMinhDo._id,
        content: 'Kem bơ ngon tuyệt mát lạnh',
        recipe_id: createdRecipesMap['Kem bơ']?._id,
        status: 'visible',
        images: [{ image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', display_order: 1 }],
        created_at: new Date(Date.now() - 48 * 3600 * 1000), // 2 ngày trước
      },
    ];

    const createdPostDocs = await Post.insertMany(samplePosts);

    // Seed sample likes in user_collections
    console.log('❤️ Đang nạp dữ liệu lượt thích bài viết...');
    await UserCollection.create({
      user_id: userMinhDo._id,
      name: 'Bài viết đã thích',
      items: [
        { item_type: 'post', item_id: createdPostDocs[0]._id, added_at: new Date() },
        { item_type: 'post', item_id: createdPostDocs[1]._id, added_at: new Date() },
        { item_type: 'post', item_id: createdPostDocs[5]._id, added_at: new Date() },
      ],
      created_at: new Date(),
    });

    console.log('✅ Nạp dữ liệu seed thành công (Food items, Users, Recipes, Posts & Collections)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
