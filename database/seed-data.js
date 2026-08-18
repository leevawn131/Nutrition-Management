// ============================================================
// SEED DATA SCRIPT — Ứng dụng Quản lý Dinh dưỡng & Vận động
// Tạo sẵn 5 bản ghi mẫu cho TẤT CẢ các collections
// 
// Cách chạy:
//   mongosh "mongodb://localhost:27017/nutrition_app" database/seed-data.js
// hoặc mở mongosh / MongoDB Compass rồi chạy script này
// ============================================================

use("nutrition_app");

print("⏳ Đang làm sạch dữ liệu cũ và tiến hành nạp Seed Data...");

// ------------------------------------------------------------
// 0. KHỞI TẠO CÁC OBJECT ID ĐỂ LIÊN KẾT GIỮA CÁC COLLECTION
// ------------------------------------------------------------

// User IDs (1 Admin + 4 Users)
const uAdminId = new ObjectId();
const uUser1Id = new ObjectId(); // Nguyễn Văn An (Mục tiêu giảm mỡ)
const uUser2Id = new ObjectId(); // Trần Thị Bích (Mục tiêu tăng cơ)
const uUser3Id = new ObjectId(); // Lê Hoàng Nam (Duy trì vóc dáng)
const uUser4Id = new ObjectId(); // Phạm Mai Linh (Ăn chay Eat Clean)

// Food Item IDs
const fPhoBoId     = new ObjectId();
const fComTamId    = new ObjectId();
const fUcGaId      = new ObjectId();
const fSaladCaHoiId = new ObjectId();
const fBunChaId    = new ObjectId();

// Activity IDs
const aChayBoId  = new ObjectId();
const aDapXeId   = new ObjectId();
const aGymId     = new ObjectId();
const aBoiLoiId  = new ObjectId();
const aYogaId    = new ObjectId();

// Recipe IDs
const rUcGaApChaoId = new ObjectId();
const rSaladCaHoiId = new ObjectId();
const rCanhRongBienId = new ObjectId();
const rOvernightOatsId = new ObjectId();
const rBoBitTetId = new ObjectId();

// Meal Plan Template ID & Meal Plan IDs
const tEatClean7DaysId = new ObjectId();
const tTangCoGiamMoId  = new ObjectId();
const mp1Id = new ObjectId();
const mp2Id = new ObjectId();

// Post IDs
const pPost1Id = new ObjectId();
const pPost2Id = new ObjectId();
const pPost3Id = new ObjectId();

// Chat Conversation IDs
const cConv1Id = new ObjectId();
const cConv2Id = new ObjectId();

// Recipe Comment IDs
const rcComment1Id = new ObjectId();

// Meal Log IDs
const mlLog1Id = new ObjectId();
const mlLog2Id = new ObjectId();

// ------------------------------------------------------------
// 1. MODULE A: USERS (5 Documents)
// ------------------------------------------------------------
db.users.deleteMany({});
db.users.insertMany([
  {
    _id: uAdminId,
    email: "admin@nutrition.app",
    password_hash: "$2b$10$0ztLa/cxRt1bGPnz79RLHOKzSync9fkakA9A3FUewylinkV/eY/uO", // password: Admin@123456
    full_name: "Quản trị viên Hệ thống",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    gender: "male",
    date_of_birth: new Date("1995-03-15"),
    height_cm: 175.0,
    weight_kg: 70.0,
    activity_level: "moderate",
    goal: "maintain",
    target_calories: 2200,
    target_protein_g: 130.0,
    target_carb_g: 250.0,
    target_fat_g: 65.0,
    role: "admin",
    food_preferences: [
      { preference_type: "diet_type", value: "Eat Clean" },
      { preference_type: "favorite", value: "Thịt bò, ức gà" }
    ],
    streak: { current_streak: 15, longest_streak: 30, last_success_date: new Date("2026-08-16") },
    created_at: new Date("2026-01-01T08:00:00Z"),
    updated_at: new Date("2026-08-16T10:00:00Z")
  },
  {
    _id: uUser1Id,
    email: "nguyenvanan@gmail.com",
    password_hash: "$2b$10$4tGD2XRASaObXidQnx4s8OyvvPqkrhqILpz4hURLVuG/RD1hfQN/m", // password: User1@123
    full_name: "Nguyễn Văn An",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
    gender: "male",
    date_of_birth: new Date("1998-07-20"),
    height_cm: 172.0,
    weight_kg: 78.5,
    activity_level: "light",
    goal: "lose",
    target_calories: 1800,
    target_protein_g: 135.0,
    target_carb_g: 180.0,
    target_fat_g: 45.0,
    role: "user",
    food_preferences: [
      { preference_type: "allergy", value: "Dị ứng đậu phộng" },
      { preference_type: "dislike", value: "Hành tây sống" }
    ],
    streak: { current_streak: 7, longest_streak: 14, last_success_date: new Date("2026-08-16") },
    created_at: new Date("2026-02-10T09:30:00Z"),
    updated_at: new Date("2026-08-15T15:00:00Z")
  },
  {
    _id: uUser2Id,
    email: "tranthibich@gmail.com",
    password_hash: "$2b$10$oUMLn6o0Gqr91b1z7mc61OxjCZuWMiNS6.AF96PREg9sARlRqfUXe", // password: User2@123
    full_name: "Trần Thị Bích",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    gender: "female",
    date_of_birth: new Date("2000-11-05"),
    height_cm: 160.0,
    weight_kg: 48.0,
    activity_level: "active",
    goal: "gain",
    target_calories: 2100,
    target_protein_g: 110.0,
    target_carb_g: 270.0,
    target_fat_g: 55.0,
    role: "user",
    food_preferences: [
      { preference_type: "favorite", value: "Salad cá hồi, sinh tố bơ" },
      { preference_type: "allergy", value: "Không dung nạp lactose" }
    ],
    streak: { current_streak: 12, longest_streak: 20, last_success_date: new Date("2026-08-16") },
    created_at: new Date("2026-03-01T14:00:00Z"),
    updated_at: new Date("2026-08-16T18:30:00Z")
  },
  {
    _id: uUser3Id,
    email: "lehoangnam@gmail.com",
    password_hash: "$2b$10$G3nfcsWeQnHhhTz0.jZ4Rug5Gf5QBZvlaWx59w/Y7XQkrgdc7yC/y", // password: User3@123
    full_name: "Lê Hoàng Nam",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    gender: "male",
    date_of_birth: new Date("1993-05-12"),
    height_cm: 180.0,
    weight_kg: 75.0,
    activity_level: "very_active",
    goal: "maintain",
    target_calories: 2600,
    target_protein_g: 160.0,
    target_carb_g: 320.0,
    target_fat_g: 70.0,
    role: "user",
    food_preferences: [
      { preference_type: "diet_type", value: "High Protein" },
      { preference_type: "favorite", value: "Bò bít tết, yến mạch" }
    ],
    streak: { current_streak: 25, longest_streak: 45, last_success_date: new Date("2026-08-16") },
    created_at: new Date("2026-01-20T11:15:00Z"),
    updated_at: new Date("2026-08-14T20:00:00Z")
  },
  {
    _id: uUser4Id,
    email: "phamtomailinh@gmail.com",
    password_hash: "$2b$10$rdi4B7Vt4plxW5Bu3ett0eeZVaXUi1/eUXCR/kgGRvgVa9yY9Dkx2", // password: User4@123
    full_name: "Phạm Mai Linh",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    gender: "female",
    date_of_birth: new Date("2001-09-28"),
    height_cm: 165.0,
    weight_kg: 54.0,
    activity_level: "moderate",
    goal: "maintain",
    target_calories: 1900,
    target_protein_g: 90.0,
    target_carb_g: 240.0,
    target_fat_g: 50.0,
    role: "user",
    food_preferences: [
      { preference_type: "diet_type", value: "Vegetarian (Ăn chay linh hoạt)" },
      { preference_type: "dislike", value: "Đồ chiên nhiều dầu mỡ" }
    ],
    streak: { current_streak: 5, longest_streak: 18, last_success_date: new Date("2026-08-15") },
    created_at: new Date("2026-04-05T08:45:00Z"),
    updated_at: new Date("2026-08-15T21:00:00Z")
  }
]);

// ------------------------------------------------------------
// 2. MODULE B: FOOD ITEMS (5 Documents)
// ------------------------------------------------------------
db.food_items.deleteMany({});
db.food_items.insertMany([
  {
    _id: fPhoBoId,
    name: "Phở bò tái",
    name_en: "Beef Pho with Rare Beef",
    category: "Món nước",
    calories_per_100g: 115.0,
    protein_per_100g: 7.5,
    carb_per_100g: 16.2,
    fat_per_100g: 2.8,
    image_url: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43",
    is_verified: true,
    aliases: ["phở bò", "phở tái", "pho bo tai", "phở bò tái chín"],
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-05T08:00:00Z")
  },
  {
    _id: fComTamId,
    name: "Cơm tấm sườn nướng",
    name_en: "Broken Rice with Grilled Pork Chop",
    category: "Món cơm",
    calories_per_100g: 185.0,
    protein_per_100g: 8.2,
    carb_per_100g: 24.5,
    fat_per_100g: 6.0,
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    is_verified: true,
    aliases: ["cơm tấm sườn", "com tam suon nuong", "cơm sườn"],
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-05T08:15:00Z")
  },
  {
    _id: fUcGaId,
    name: "Ức gà luộc / áp chảo",
    name_en: "Boiled / Pan-seared Chicken Breast",
    category: "Thịt & Gia cầm",
    calories_per_100g: 165.0,
    protein_per_100g: 31.0,
    carb_per_100g: 0.0,
    fat_per_100g: 3.6,
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    is_verified: true,
    aliases: ["ức gà", "uc ga luoc", "thịt ức gà", "chicken breast"],
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-05T08:30:00Z")
  },
  {
    _id: fSaladCaHoiId,
    name: "Salad cá hồi sốt mè rang",
    name_en: "Salmon Salad with Roasted Sesame Dressing",
    category: "Salad & Eat Clean",
    calories_per_100g: 135.0,
    protein_per_100g: 11.0,
    carb_per_100g: 5.5,
    fat_per_100g: 7.8,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    is_verified: true,
    aliases: ["salad cá hồi", "salad ca hoi", "salmon salad"],
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-06T09:00:00Z")
  },
  {
    _id: fBunChaId,
    name: "Bún chả Hà Nội",
    name_en: "Hanoi Grilled Pork with Rice Noodles",
    category: "Món nước / Bún",
    calories_per_100g: 160.0,
    protein_per_100g: 7.8,
    carb_per_100g: 20.1,
    fat_per_100g: 5.4,
    image_url: "https://images.unsplash.com/photo-1559847844-5315695dadae",
    is_verified: true,
    aliases: ["bún chả", "bun cha ha noi", "bún thịt nướng hà nội"],
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-06T09:30:00Z")
  }
]);

// ------------------------------------------------------------
// 3. MODULE B: RECOGNITION HISTORY (5 Documents)
// ------------------------------------------------------------
db.recognition_history.deleteMany({});
db.recognition_history.insertMany([
  {
    user_id: uUser1Id,
    meal_log_id: mlLog1Id,
    source_type: "image",
    raw_input: "https://storage.googleapis.com/nutrition-uploads/pho-bo-1.jpg",
    predicted_label: "Phở bò tái",
    confidence: 94.5,
    corrected_label: null,
    ai_model: "gemini-1.5-flash",
    raw_response: JSON.stringify({
      food_name: "Phở bò tái",
      confidence: 0.945,
      estimated_weight_g: 450,
      calories: 520
    }),
    created_at: new Date("2026-08-17T06:45:00Z")
  },
  {
    user_id: uUser1Id,
    meal_log_id: mlLog2Id,
    source_type: "image",
    raw_input: "https://storage.googleapis.com/nutrition-uploads/com-tam-1.jpg",
    predicted_label: "Cơm tấm sườn",
    confidence: 91.2,
    corrected_label: "Cơm tấm sườn nướng",
    ai_model: "gemini-1.5-flash",
    raw_response: JSON.stringify({
      food_name: "Cơm tấm sườn",
      confidence: 0.912,
      estimated_weight_g: 380,
      calories: 700
    }),
    created_at: new Date("2026-08-17T11:45:00Z")
  },
  {
    user_id: uUser2Id,
    meal_log_id: null,
    source_type: "text",
    raw_input: "1 đĩa salad cá hồi xốt mè và 1 cốc nước ép ổi",
    predicted_label: "Salad cá hồi sốt mè rang",
    confidence: 88.0,
    corrected_label: null,
    ai_model: "gemini-1.5-pro",
    raw_response: JSON.stringify({
      items: [
        { name: "Salad cá hồi sốt mè rang", calories: 350 },
        { name: "Nước ép ổi", calories: 85 }
      ]
    }),
    created_at: new Date("2026-08-16T12:10:00Z")
  },
  {
    user_id: uUser3Id,
    meal_log_id: null,
    source_type: "image",
    raw_input: "https://storage.googleapis.com/nutrition-uploads/steak-1.jpg",
    predicted_label: "Bò bít tết kèm khoai tây nghiền",
    confidence: 96.0,
    corrected_label: null,
    ai_model: "gemini-1.5-flash",
    raw_response: JSON.stringify({
      food_name: "Bò bít tết",
      confidence: 0.96,
      estimated_weight_g: 300,
      calories: 620
    }),
    created_at: new Date("2026-08-16T19:00:00Z")
  },
  {
    user_id: uUser4Id,
    meal_log_id: null,
    source_type: "text",
    raw_input: "Bát cháo yến mạch hạt chia chuối tiêu",
    predicted_label: "Overnight Oats chuối hạt chia",
    confidence: 89.5,
    corrected_label: null,
    ai_model: "gemini-1.5-flash",
    raw_response: JSON.stringify({
      food_name: "Yến mạch chuối hạt chia",
      confidence: 0.895,
      calories: 280
    }),
    created_at: new Date("2026-08-17T07:15:00Z")
  }
]);

// ------------------------------------------------------------
// 4. MODULE B: MEAL LOGS (5 Documents)
// ------------------------------------------------------------
db.meal_logs.deleteMany({});
db.meal_logs.insertMany([
  {
    _id: mlLog1Id,
    user_id: uUser1Id,
    food_item_id: fPhoBoId,
    input_method: "photo",
    source_image_url: "https://storage.googleapis.com/nutrition-uploads/pho-bo-1.jpg",
    description_text: "Phở bò tái 1 tô vừa",
    portion_label: "medium",
    portion_grams: 450.0,
    calories: 517.5,
    protein_g: 33.7,
    carb_g: 72.9,
    fat_g: 12.6,
    meal_type: "breakfast",
    logged_at: new Date("2026-08-17T07:00:00Z"),
    created_at: new Date("2026-08-17T07:02:00Z"),
    recognition_summary: {
      predicted_label: "Phở bò tái",
      confidence: 94.5,
      corrected_label: null
    }
  },
  {
    _id: mlLog2Id,
    user_id: uUser1Id,
    food_item_id: fComTamId,
    input_method: "gallery",
    source_image_url: "https://storage.googleapis.com/nutrition-uploads/com-tam-1.jpg",
    description_text: "Cơm tấm sườn nướng kèm trứng ốp la",
    portion_label: "large",
    portion_grams: 380.0,
    calories: 703.0,
    protein_g: 31.1,
    carb_g: 93.1,
    fat_g: 22.8,
    meal_type: "lunch",
    logged_at: new Date("2026-08-17T12:00:00Z"),
    created_at: new Date("2026-08-17T12:05:00Z"),
    recognition_summary: {
      predicted_label: "Cơm tấm sườn",
      confidence: 91.2,
      corrected_label: "Cơm tấm sườn nướng"
    }
  },
  {
    user_id: uUser2Id,
    food_item_id: fSaladCaHoiId,
    input_method: "text",
    source_image_url: null,
    description_text: "Salad cá hồi sốt mè rang đĩa lớn",
    portion_label: "medium",
    portion_grams: 280.0,
    calories: 378.0,
    protein_g: 30.8,
    carb_g: 15.4,
    fat_g: 21.8,
    meal_type: "lunch",
    logged_at: new Date("2026-08-16T12:30:00Z"),
    created_at: new Date("2026-08-16T12:31:00Z"),
    recognition_summary: null
  },
  {
    user_id: uUser3Id,
    food_item_id: fUcGaId,
    input_method: "text",
    source_image_url: null,
    description_text: "200g ức gà áp chảo ăn kèm khoai lang luộc",
    portion_label: "large",
    portion_grams: 200.0,
    calories: 330.0,
    protein_g: 62.0,
    carb_g: 0.0,
    fat_g: 7.2,
    meal_type: "dinner",
    logged_at: new Date("2026-08-16T18:30:00Z"),
    created_at: new Date("2026-08-16T18:35:00Z"),
    recognition_summary: null
  },
  {
    user_id: uUser4Id,
    food_item_id: fBunChaId,
    input_method: "photo",
    source_image_url: "https://storage.googleapis.com/nutrition-uploads/bun-cha-1.jpg",
    description_text: "Bún chả Hà Nội suất vừa",
    portion_label: "medium",
    portion_grams: 350.0,
    calories: 560.0,
    protein_g: 27.3,
    carb_g: 70.3,
    fat_g: 18.9,
    meal_type: "lunch",
    logged_at: new Date("2026-08-17T11:30:00Z"),
    created_at: new Date("2026-08-17T11:32:00Z"),
    recognition_summary: {
      predicted_label: "Bún chả",
      confidence: 93.0,
      corrected_label: null
    }
  }
]);

// ------------------------------------------------------------
// 5. MODULE B: UNIDENTIFIED FOODS (5 Documents)
// ------------------------------------------------------------
db.unidentified_foods.deleteMany({});
db.unidentified_foods.insertMany([
  {
    reported_by_user_id: uUser1Id,
    image_url: "https://storage.googleapis.com/nutrition-uploads/banh-hoi-thit-nuong.jpg",
    name_guess: "Bánh hỏi thịt nướng Quy Nhơn",
    status: "pending",
    resolved_food_item_id: null,
    created_at: new Date("2026-08-15T10:00:00Z")
  },
  {
    reported_by_user_id: uUser2Id,
    image_url: "https://storage.googleapis.com/nutrition-uploads/che-duong-nhan.jpg",
    name_guess: "Chè dưỡng nhan tuyết yến",
    status: "pending",
    resolved_food_item_id: null,
    created_at: new Date("2026-08-16T14:20:00Z")
  },
  {
    reported_by_user_id: uUser3Id,
    image_url: "https://storage.googleapis.com/nutrition-uploads/sup-bao-ngu.jpg",
    name_guess: "Súp bào ngư vi cá",
    status: "pending",
    resolved_food_item_id: null,
    created_at: new Date("2026-08-16T19:40:00Z")
  },
  {
    reported_by_user_id: uUser4Id,
    image_url: "https://storage.googleapis.com/nutrition-uploads/banh-mi-chao.jpg",
    name_guess: "Bánh mì chảo pate trứng xúc xích",
    status: "resolved",
    resolved_food_item_id: fComTamId,
    created_at: new Date("2026-08-10T08:15:00Z")
  },
  {
    reported_by_user_id: uUser1Id,
    image_url: "https://storage.googleapis.com/nutrition-uploads/ca-vien-chien.jpg",
    name_guess: "Cá viên chiên mắm tỏi",
    status: "resolved",
    resolved_food_item_id: fUcGaId,
    created_at: new Date("2026-08-11T16:30:00Z")
  }
]);

// ------------------------------------------------------------
// 6. MODULE C: ACTIVITIES (5 Documents)
// ------------------------------------------------------------
db.activities.deleteMany({});
db.activities.insertMany([
  {
    _id: aChayBoId,
    name: "Chạy bộ (tốc độ trung bình 8 km/h)",
    met_value: 8.3,
    category: "Cardio",
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-10T08:00:00Z")
  },
  {
    _id: aDapXeId,
    name: "Đạp xe đạp (15 - 20 km/h)",
    met_value: 6.8,
    category: "Cardio",
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-10T08:10:00Z")
  },
  {
    _id: aGymId,
    name: "Tập tạ / Gym kháng lực (cường độ vừa)",
    met_value: 5.0,
    category: "Kháng lực (Strength)",
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-10T08:20:00Z")
  },
  {
    _id: aBoiLoiId,
    name: "Bơi lội tự do (tốc độ vừa)",
    met_value: 7.0,
    category: "Cardio & Toàn thân",
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-10T08:30:00Z")
  },
  {
    _id: aYogaId,
    name: "Tập Yoga / Giãn cơ (Stretching)",
    met_value: 2.8,
    category: "Dẻo dai & Thư giãn",
    created_by_admin_id: uAdminId,
    created_at: new Date("2026-01-10T08:40:00Z")
  }
]);

// ------------------------------------------------------------
// 7. MODULE C: ACTIVITY LOGS (5 Documents)
// ------------------------------------------------------------
db.activity_logs.deleteMany({});
db.activity_logs.insertMany([
  {
    user_id: uUser1Id,
    activity_id: aChayBoId,
    custom_activity_name: null,
    duration_minutes: 30,
    calories_burned: 325.5, // MET (8.3) * 78.5kg * (30/60)
    logged_at: new Date("2026-08-16T17:30:00Z"),
    created_at: new Date("2026-08-16T18:05:00Z")
  },
  {
    user_id: uUser2Id,
    activity_id: aGymId,
    custom_activity_name: null,
    duration_minutes: 45,
    calories_burned: 180.0, // MET (5.0) * 48kg * (45/60)
    logged_at: new Date("2026-08-16T08:00:00Z"),
    created_at: new Date("2026-08-16T08:50:00Z")
  },
  {
    user_id: uUser3Id,
    activity_id: aGymId,
    custom_activity_name: null,
    duration_minutes: 60,
    calories_burned: 375.0, // MET (5.0) * 75kg * 1h
    logged_at: new Date("2026-08-17T06:00:00Z"),
    created_at: new Date("2026-08-17T07:05:00Z")
  },
  {
    user_id: uUser4Id,
    activity_id: aYogaId,
    custom_activity_name: null,
    duration_minutes: 40,
    calories_burned: 100.8, // MET (2.8) * 54kg * (40/60)
    logged_at: new Date("2026-08-16T20:00:00Z"),
    created_at: new Date("2026-08-16T20:45:00Z")
  },
  {
    user_id: uUser1Id,
    activity_id: null,
    custom_activity_name: "Chơi cầu lông đôi với bạn bè",
    duration_minutes: 45,
    calories_burned: 260.0,
    logged_at: new Date("2026-08-17T17:00:00Z"),
    created_at: new Date("2026-08-17T17:50:00Z")
  }
]);

// ------------------------------------------------------------
// 8. MODULE D: CHAT CONVERSATIONS (5 Documents)
// ------------------------------------------------------------
db.chat_conversations.deleteMany({});
db.chat_conversations.insertMany([
  {
    _id: cConv1Id,
    user_id: uUser1Id,
    title: "Tư vấn thực đơn giảm 3kg trong 1 tháng",
    created_at: new Date("2026-08-15T09:00:00Z")
  },
  {
    _id: cConv2Id,
    user_id: uUser2Id,
    title: "Cách bổ sung đạm cho người không uống được sữa bò",
    created_at: new Date("2026-08-16T10:30:00Z")
  },
  {
    user_id: uUser3Id,
    title: "Lịch tập Gym và ăn trước/sau tập để tăng cơ tối đa",
    created_at: new Date("2026-08-16T15:00:00Z")
  },
  {
    user_id: uUser4Id,
    title: "Gợi ý bữa tối Eat Clean ít carb dưới 400 Calo",
    created_at: new Date("2026-08-17T08:00:00Z")
  },
  {
    user_id: uUser1Id,
    title: "Hỏi về tác dụng của hạt chia và cách ngâm",
    created_at: new Date("2026-08-17T14:15:00Z")
  }
]);

// ------------------------------------------------------------
// 9. MODULE D: CHAT MESSAGES (5 Documents)
// ------------------------------------------------------------
db.chat_messages.deleteMany({});
db.chat_messages.insertMany([
  {
    conversation_id: cConv1Id,
    sender: "user",
    content: "Chào AI, mình 78kg cao 1m72, muốn giảm xuống 75kg trong 1 tháng thì mỗi ngày nên ăn bao nhiêu calo?",
    suggested_action_type: null,
    suggested_action_payload: null,
    created_at: new Date("2026-08-15T09:00:10Z")
  },
  {
    conversation_id: cConv1Id,
    sender: "ai",
    content: "Chào An! TDEE hiện tại của bạn khoảng 2.300 kcal. Để giảm 3kg an toàn trong 4 tuần, bạn nên thâm hụt khoảng 500 kcal/ngày, tương đương mục tiêu **1.800 kcal/ngày** (Protein: 135g, Carb: 180g, Fat: 45g). Mình có thể giúp bạn cập nhật mục tiêu này ngay bây giờ!",
    suggested_action_type: "set_goal",
    suggested_action_payload: { target_calories: 1800, target_protein_g: 135, target_carb_g: 180, target_fat_g: 45 },
    created_at: new Date("2026-08-15T09:00:25Z")
  },
  {
    conversation_id: cConv1Id,
    sender: "user",
    content: "Gợi ý cho mình công thức bữa trưa nhanh gọn khoảng 500 calo nhiều đạm nhé!",
    suggested_action_type: null,
    suggested_action_payload: null,
    created_at: new Date("2026-08-15T09:02:00Z")
  },
  {
    conversation_id: cConv1Id,
    sender: "ai",
    content: "Bạn thử món **Ức gà áp chảo sốt chanh leo** nhé! Cung cấp khoảng 480 kcal, 45g Protein và chỉ 6g Fat. Mình đã tạo sẵn công thức trong hệ thống, bạn có muốn thêm vào kế hoạch bữa trưa ngày mai không?",
    suggested_action_type: "add_to_meal_plan",
    suggested_action_payload: { recipe_id: rUcGaApChaoId, meal_type: "lunch", plan_date: "2026-08-18" },
    created_at: new Date("2026-08-15T09:02:15Z")
  },
  {
    conversation_id: cConv2Id,
    sender: "user",
    content: "Mình bị dị ứng sữa bò thì uống whey loại nào hoặc ăn gì để đủ 100g protein mỗi ngày?",
    suggested_action_type: null,
    suggested_action_payload: null,
    created_at: new Date("2026-08-16T10:30:10Z")
  }
]);

// ------------------------------------------------------------
// 10. MODULE E: RECIPES (5 Documents với đầy đủ vi chất dinh dưỡng)
// ------------------------------------------------------------
db.recipes.deleteMany({});
db.recipes.insertMany([
  {
    _id: rUcGaApChaoId,
    title: "Ức gà áp chảo sốt chanh leo Eat Clean",
    description: "Món ăn giàu đạm, ít béo, sốt chanh leo chua ngọt thơm ngon không bị khô.",
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    servings: 2,
    calories_per_serving: 320.0,
    protein_g: 42.0,
    carb_g: 12.0,
    fat_g: 6.5,
    avg_rating: 4.8,
    comment_count: 12,
    source_type: "system",
    created_by_user_id: uAdminId,
    status: "approved",
    created_at: new Date("2026-01-15T10:00:00Z"),
    ingredients: [
      { ingredient_name: "Ức gà phi lê", quantity: 300.0, unit: "g" },
      { ingredient_name: "Chanh leo (chanh dây)", quantity: 2.0, unit: "quả" },
      { ingredient_name: "Mật ong nguyên chất", quantity: 1.0, unit: "muỗng canh" },
      { ingredient_name: "Dầu ô liu", quantity: 5.0, unit: "ml" },
      { ingredient_name: "Muối tiêu, tỏi băm", quantity: 1.0, unit: "muỗng cà phê" }
    ],
    steps: [
      { step_number: 1, instruction: "Ức gà rửa sạch, khía vảy rồng, ướp với chút muối, tiêu và tỏi băm trong 10 phút." },
      { step_number: 2, instruction: "Chanh leo lọc lấy nước cốt, khuấy đều với 1 muỗng mật ong và 2 muỗng nước lọc." },
      { step_number: 3, instruction: "Làm nóng chảo với dầu ô liu, áp chảo ức gà mỗi mặt 4-5 phút đến khi vàng đều." },
      { step_number: 4, instruction: "Đổ sốt chanh leo vào chảo đun nhỏ lửa 2 phút cho sốt sệt lại và ngấm vào gà." }
    ],
    nutrition_facts: {
      energy_kcal: 320.0,
      protein_g: 42.0,
      carbohydrate_g: 12.0,
      fat_g: 6.5,
      fiber_g: 2.1,
      saturated_fat_g: 1.2,
      trans_fat_g: 0.0,
      unsaturated_fat_g: 4.8,
      cholesterol_mg: 95.0,
      salt_g: 1.1,
      sodium_mg: 440.0,
      glycemic_load: 3.5,
      vitamin_a_mcg: 120.0,
      vitamin_d_mcg: 0.3,
      vitamin_e_mg: 1.5,
      vitamin_k_mcg: 4.2,
      vitamin_c_mg: 28.0,
      vitamin_b12_mcg: 0.6,
      folic_acid_mcg: 18.0,
      calcium_mg: 35.0,
      iron_mg: 1.8,
      zinc_mg: 2.1,
      magnesium_mg: 45.0,
      potassium_mg: 420.0,
      phosphorus_mg: 310.0,
      updated_at: new Date("2026-08-01T00:00:00Z")
    }
  },
  {
    _id: rSaladCaHoiId,
    title: "Salad cá hồi bơ sáp mè rang",
    description: "Sự kết hợp hoàn hảo giữa chất béo tốt Omega-3 từ cá hồi, quả bơ và rau củ tươi mát.",
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 1,
    calories_per_serving: 420.0,
    protein_g: 28.5,
    carb_g: 16.0,
    fat_g: 24.0,
    avg_rating: 4.9,
    comment_count: 8,
    source_type: "community",
    created_by_user_id: uUser2Id,
    status: "approved",
    created_at: new Date("2026-02-10T14:00:00Z"),
    ingredients: [
      { ingredient_name: "Cá hồi tươi phi lê", quantity: 120.0, unit: "g" },
      { ingredient_name: "Quả bơ sáp", quantity: 0.5, unit: "quả" },
      { ingredient_name: "Xà lách thủy canh, cà chua bi", quantity: 150.0, unit: "g" },
      { ingredient_name: "Sốt mè rang Kewpie", quantity: 2.0, unit: "muỗng canh" }
    ],
    steps: [
      { step_number: 1, instruction: "Rau xà lách và cà chua bi ngâm nước muối loãng, rửa sạch, để ráo nước." },
      { step_number: 2, instruction: "Cá hồi áp chảo sơ 2 mặt (hoặc thái sashimi tùy sở thích)." },
      { step_number: 3, instruction: "Bơ cắt hạt lựu, xếp rau, cà chua, cá hồi ra đĩa và rưới sốt mè rang lên trên." }
    ],
    nutrition_facts: {
      energy_kcal: 420.0,
      protein_g: 28.5,
      carbohydrate_g: 16.0,
      fat_g: 24.0,
      fiber_g: 6.8,
      saturated_fat_g: 4.1,
      trans_fat_g: 0.0,
      unsaturated_fat_g: 18.2,
      cholesterol_mg: 65.0,
      salt_g: 1.3,
      sodium_mg: 510.0,
      glycemic_load: 2.0,
      vitamin_a_mcg: 240.0,
      vitamin_d_mcg: 11.5,
      vitamin_e_mg: 4.2,
      vitamin_k_mcg: 65.0,
      vitamin_c_mg: 32.0,
      vitamin_b12_mcg: 3.2,
      folic_acid_mcg: 75.0,
      calcium_mg: 60.0,
      iron_mg: 2.4,
      zinc_mg: 1.5,
      magnesium_mg: 58.0,
      potassium_mg: 680.0,
      phosphorus_mg: 290.0,
      updated_at: new Date("2026-08-01T00:00:00Z")
    }
  },
  {
    _id: rCanhRongBienId,
    title: "Canh rong biển đậu hũ non thịt bằm",
    description: "Món canh thanh nhiệt, giàu khoáng chất I-ốt và Canxi, cực kỳ dễ nấu.",
    image_url: "https://images.unsplash.com/photo-1547592180-85f173990554",
    prep_time_minutes: 10,
    cook_time_minutes: 10,
    servings: 3,
    calories_per_serving: 140.0,
    protein_g: 12.0,
    carb_g: 6.0,
    fat_g: 5.5,
    avg_rating: 4.6,
    comment_count: 5,
    source_type: "system",
    created_by_user_id: uAdminId,
    status: "approved",
    created_at: new Date("2026-02-15T09:00:00Z"),
    ingredients: [
      { ingredient_name: "Rong biển khô nấu canh", quantity: 20.0, unit: "g" },
      { ingredient_name: "Đậu hũ non", quantity: 1.0, unit: "hộp" },
      { ingredient_name: "Thịt heo nạc xay", quantity: 100.0, unit: "g" },
      { ingredient_name: "Gừng tươi, hành lá", quantity: 10.0, unit: "g" }
    ],
    steps: [
      { step_number: 1, instruction: "Rong biển ngâm nước 10 phút cho nở đều, vớt ra cắt khúc vừa ăn." },
      { step_number: 2, instruction: "Phi thơm đầu hành và gừng băm, cho thịt xay vào xào săn." },
      { step_number: 3, instruction: "Đổ 800ml nước vào đun sôi, cho rong biển và đậu hũ non cắt miếng vuông vào nấu thêm 3 phút." }
    ],
    nutrition_facts: {
      energy_kcal: 140.0,
      protein_g: 12.0,
      carbohydrate_g: 6.0,
      fat_g: 5.5,
      fiber_g: 2.5,
      saturated_fat_g: 1.5,
      trans_fat_g: 0.0,
      unsaturated_fat_g: 3.5,
      cholesterol_mg: 25.0,
      salt_g: 1.5,
      sodium_mg: 620.0,
      glycemic_load: 1.0,
      vitamin_a_mcg: 80.0,
      vitamin_d_mcg: 0.1,
      vitamin_e_mg: 0.8,
      vitamin_k_mcg: 35.0,
      vitamin_c_mg: 4.0,
      vitamin_b12_mcg: 0.4,
      folic_acid_mcg: 45.0,
      calcium_mg: 180.0,
      iron_mg: 3.1,
      zinc_mg: 1.8,
      magnesium_mg: 72.0,
      potassium_mg: 340.0,
      phosphorus_mg: 150.0,
      updated_at: new Date("2026-08-01T00:00:00Z")
    }
  },
  {
    _id: rOvernightOatsId,
    title: "Yến mạch ngâm qua đêm (Overnight Oats) chuối hạt chia",
    description: "Bữa sáng tiện lợi chuẩn bị từ tối hôm trước, dồi dào chất xơ beta-glucan giúp no lâu.",
    image_url: "https://images.unsplash.com/photo-1517673400267-0251440c45dc",
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    calories_per_serving: 310.0,
    protein_g: 11.5,
    carb_g: 52.0,
    fat_g: 6.2,
    avg_rating: 4.7,
    comment_count: 15,
    source_type: "community",
    created_by_user_id: uUser4Id,
    status: "approved",
    created_at: new Date("2026-03-01T11:00:00Z"),
    ingredients: [
      { ingredient_name: "Yến mạch cán dẹt (Rolled Oats)", quantity: 40.0, unit: "g" },
      { ingredient_name: "Sữa hạt hạnh nhân không đường", quantity: 120.0, unit: "ml" },
      { ingredient_name: "Hạt chia", quantity: 1.0, unit: "muỗng canh" },
      { ingredient_name: "Chuối tiêu chín", quantity: 1.0, unit: "quả" },
      { ingredient_name: "Sữa chua Hy Lạp không đường", quantity: 50.0, unit: "g" }
    ],
    steps: [
      { step_number: 1, instruction: "Cho yến mạch, hạt chia, sữa chua và sữa hạt vào hũ thủy tinh trộn đều." },
      { step_number: 2, instruction: "Đậy kín nắp và để trong ngăn mát tủ lạnh ít nhất 4 tiếng hoặc qua đêm." },
      { step_number: 3, instruction: "Sáng hôm sau lấy ra, cắt lát chuối tiêu lên trên và thưởng thức." }
    ],
    nutrition_facts: {
      energy_kcal: 310.0,
      protein_g: 11.5,
      carbohydrate_g: 52.0,
      fat_g: 6.2,
      fiber_g: 9.5,
      saturated_fat_g: 0.9,
      trans_fat_g: 0.0,
      unsaturated_fat_g: 4.8,
      cholesterol_mg: 2.0,
      salt_g: 0.2,
      sodium_mg: 95.0,
      glycemic_load: 18.0,
      vitamin_a_mcg: 30.0,
      vitamin_d_mcg: 1.2,
      vitamin_e_mg: 3.5,
      vitamin_k_mcg: 2.5,
      vitamin_c_mg: 10.5,
      vitamin_b12_mcg: 0.2,
      folic_acid_mcg: 38.0,
      calcium_mg: 220.0,
      iron_mg: 2.8,
      zinc_mg: 2.0,
      magnesium_mg: 110.0,
      potassium_mg: 480.0,
      phosphorus_mg: 260.0,
      updated_at: new Date("2026-08-01T00:00:00Z")
    }
  },
  {
    _id: rBoBitTetId,
    title: "Bò bít tết thăn ngoại sốt tiêu đen măng tây",
    description: "Món ăn cao cấp chuẩn nhà hàng, giàu đạm, sắt và kẽm cho gymer và người cần bồi bổ.",
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947",
    prep_time_minutes: 10,
    cook_time_minutes: 10,
    servings: 1,
    calories_per_serving: 520.0,
    protein_g: 48.0,
    carb_g: 8.0,
    fat_g: 32.0,
    avg_rating: 5.0,
    comment_count: 20,
    source_type: "community",
    created_by_user_id: uUser3Id,
    status: "approved",
    created_at: new Date("2026-03-10T16:00:00Z"),
    ingredients: [
      { ingredient_name: "Thăn ngoại bò Úc (Sirloin)", quantity: 200.0, unit: "g" },
      { ingredient_name: "Măng tây xanh", quantity: 100.0, unit: "g" },
      { ingredient_name: "Bơ lạt", quantity: 10.0, unit: "g" },
      { ingredient_name: "Lá hương thảo (Rosemary)", quantity: 1.0, unit: "nhánh" },
      { ingredient_name: "Sốt tiêu đen", quantity: 2.0, unit: "muỗng canh" }
    ],
    steps: [
      { step_number: 1, instruction: "Thịt bò thấm khô, ướp muối biển và tiêu đen đập dập 5 phút." },
      { step_number: 2, instruction: "Chảo gang đun thật nóng với dầu ăn, áp chảo thịt 2.5 phút mỗi mặt." },
      { step_number: 3, instruction: "Cho bơ lạt, tỏi nguyên tép và lá hương thảo vào rưới liên tục lên miếng thịt." },
      { step_number: 4, instruction: "Cho thịt nghỉ 5 phút trước khi thái, xào nhanh măng tây trên cùng chảo." }
    ],
    nutrition_facts: {
      energy_kcal: 520.0,
      protein_g: 48.0,
      carbohydrate_g: 8.0,
      fat_g: 32.0,
      fiber_g: 2.8,
      saturated_fat_g: 13.5,
      trans_fat_g: 1.1,
      unsaturated_fat_g: 15.2,
      cholesterol_mg: 140.0,
      salt_g: 1.4,
      sodium_mg: 580.0,
      glycemic_load: 1.5,
      vitamin_a_mcg: 160.0,
      vitamin_d_mcg: 0.5,
      vitamin_e_mg: 2.1,
      vitamin_k_mcg: 45.0,
      vitamin_c_mg: 8.0,
      vitamin_b12_mcg: 4.8,
      folic_acid_mcg: 60.0,
      calcium_mg: 45.0,
      iron_mg: 5.2,
      zinc_mg: 8.5,
      magnesium_mg: 52.0,
      potassium_mg: 620.0,
      phosphorus_mg: 410.0,
      updated_at: new Date("2026-08-01T00:00:00Z")
    }
  }
]);

// ------------------------------------------------------------
// 11. MODULE E: RECIPE COMMENTS (5 Documents)
// ------------------------------------------------------------
db.recipe_comments.deleteMany({});
db.recipe_comments.insertMany([
  {
    _id: rcComment1Id,
    recipe_id: rUcGaApChaoId,
    user_id: uUser1Id,
    parent_comment_id: null,
    content: "Công thức rất ngon! Ức gà làm theo cách này mềm mọng không hề bị bã.",
    rating: 5,
    status: "visible",
    created_at: new Date("2026-08-10T11:00:00Z"),
    updated_at: null
  },
  {
    recipe_id: rUcGaApChaoId,
    user_id: uAdminId,
    parent_comment_id: rcComment1Id, // Trả lời bình luận của User 1
    content: "Cảm ơn bạn An! Bí quyết là lửa vừa và không áp chảo quá thời gian quy định nhé.",
    rating: null,
    status: "visible",
    created_at: new Date("2026-08-10T11:30:00Z"),
    updated_at: null
  },
  {
    recipe_id: rSaladCaHoiId,
    user_id: uUser3Id,
    parent_comment_id: null,
    content: "Salad ăn rất cuốn, cá hồi áp chảo vừa chín tới giữ được vị ngọt béo tự nhiên.",
    rating: 5,
    status: "visible",
    created_at: new Date("2026-08-12T14:15:00Z"),
    updated_at: null
  },
  {
    recipe_id: rOvernightOatsId,
    user_id: uUser1Id,
    parent_comment_id: null,
    content: "Mình thay bằng sữa đậu nành không đường ăn vẫn rất ngon và tiện lợi.",
    rating: 4,
    status: "visible",
    created_at: new Date("2026-08-14T08:20:00Z"),
    updated_at: null
  },
  {
    recipe_id: rBoBitTetId,
    user_id: uUser2Id,
    parent_comment_id: null,
    content: "Thịt bò siêu thơm mùi bơ và hương thảo, điểm 10 cho chất lượng!",
    rating: 5,
    status: "visible",
    created_at: new Date("2026-08-15T20:00:00Z"),
    updated_at: null
  }
]);

// ------------------------------------------------------------
// 12. MODULE E: MEAL PLAN TEMPLATES (5 Documents)
// ------------------------------------------------------------
db.meal_plan_templates.deleteMany({});
db.meal_plan_templates.insertMany([
  {
    _id: tEatClean7DaysId,
    name: "Thực đơn Eat Clean Giảm Mỡ 7 Ngày",
    description: "Thực đơn chuẩn cân bằng dinh dưỡng, trung bình 1.500 - 1.700 Calo/ngày giúp giảm mỡ hiệu quả.",
    created_by_admin_id: uAdminId,
    items: [
      { meal_type: "breakfast", recipe_id: rOvernightOatsId },
      { meal_type: "lunch", recipe_id: rUcGaApChaoId },
      { meal_type: "dinner", recipe_id: rSaladCaHoiId }
    ]
  },
  {
    _id: tTangCoGiamMoId,
    name: "Thực đơn High Protein Tăng Cơ Cho Gymer",
    description: "Cung cấp trên 140g đạm mỗi ngày, hỗ trợ phục hồi và phát triển cơ bắp.",
    created_by_admin_id: uAdminId,
    items: [
      { meal_type: "breakfast", recipe_id: rOvernightOatsId },
      { meal_type: "lunch", recipe_id: rUcGaApChaoId },
      { meal_type: "dinner", recipe_id: rBoBitTetId }
    ]
  },
  {
    name: "Thực đơn Thanh Lọc Cơ Thể (Detox & Low Sodium)",
    description: "Tập trung vào rau củ tươi, rong biển và hạn chế tối đa muối natri.",
    created_by_admin_id: uAdminId,
    items: [
      { meal_type: "breakfast", recipe_id: rOvernightOatsId },
      { meal_type: "lunch", recipe_id: rCanhRongBienId },
      { meal_type: "dinner", recipe_id: rSaladCaHoiId }
    ]
  },
  {
    name: "Thực đơn Ăn Sáng Nhanh Dưới 10 Phút Cho Dân Văn Phòng",
    description: "Các món ăn sáng chuẩn bị cực nhanh nhưng vẫn đầy đủ năng lượng cho ngày dài.",
    created_by_admin_id: uAdminId,
    items: [
      { meal_type: "breakfast", recipe_id: rOvernightOatsId }
    ]
  },
  {
    name: "Thực đơn Bữa Tối Ít Tinh Bột (Low Carb Dinner)",
    description: "Hạn chế tích mỡ ban đêm, dễ tiêu hóa giúp ngủ sâu giấc hơn.",
    created_by_admin_id: uAdminId,
    items: [
      { meal_type: "dinner", recipe_id: rSaladCaHoiId },
      { meal_type: "dinner", recipe_id: rCanhRongBienId }
    ]
  }
]);

// ------------------------------------------------------------
// 13. MODULE E: MEAL PLANS (5 Documents)
// ------------------------------------------------------------
db.meal_plans.deleteMany({});
db.meal_plans.insertMany([
  {
    _id: mp1Id,
    user_id: uUser1Id,
    plan_date: new Date("2026-08-18T00:00:00Z"),
    meal_type: "breakfast",
    recipe_id: rOvernightOatsId,
    food_item_id: null,
    source: "template",
    is_logged: false,
    created_at: new Date("2026-08-17T10:00:00Z")
  },
  {
    _id: mp2Id,
    user_id: uUser1Id,
    plan_date: new Date("2026-08-18T00:00:00Z"),
    meal_type: "lunch",
    recipe_id: rUcGaApChaoId,
    food_item_id: null,
    source: "recipe",
    is_logged: false,
    created_at: new Date("2026-08-17T10:05:00Z")
  },
  {
    user_id: uUser1Id,
    plan_date: new Date("2026-08-18T00:00:00Z"),
    meal_type: "dinner",
    recipe_id: null,
    food_item_id: fPhoBoId,
    source: "manual",
    is_logged: false,
    created_at: new Date("2026-08-17T10:10:00Z")
  },
  {
    user_id: uUser2Id,
    plan_date: new Date("2026-08-18T00:00:00Z"),
    meal_type: "lunch",
    recipe_id: rSaladCaHoiId,
    food_item_id: null,
    source: "recipe",
    is_logged: false,
    created_at: new Date("2026-08-17T14:00:00Z")
  },
  {
    user_id: uUser3Id,
    plan_date: new Date("2026-08-18T00:00:00Z"),
    meal_type: "dinner",
    recipe_id: rBoBitTetId,
    food_item_id: null,
    source: "recipe",
    is_logged: false,
    created_at: new Date("2026-08-17T16:00:00Z")
  }
]);

// ------------------------------------------------------------
// 14. MODULE F: ACTIVITY PLANS (5 Documents)
// ------------------------------------------------------------
db.activity_plans.deleteMany({});
db.activity_plans.insertMany([
  {
    user_id: uUser1Id,
    activity_name: "Chạy bộ công viên 5km",
    plan_date: new Date("2026-08-18T00:00:00Z"),
    start_time: "17:30",
    duration_minutes: 35,
    note: "Khởi động kỹ cổ chân trước khi chạy",
    is_completed: false,
    created_at: new Date("2026-08-17T09:00:00Z")
  },
  {
    user_id: uUser2Id,
    activity_name: "Tập mông đùi (Leg Day)",
    plan_date: new Date("2026-08-18T00:00:00Z"),
    start_time: "07:00",
    duration_minutes: 45,
    note: "Squat 4 hiệp, Hip Thrust 4 hiệp",
    is_completed: false,
    created_at: new Date("2026-08-17T11:00:00Z")
  },
  {
    user_id: uUser3Id,
    activity_name: "Tập ngực & tay sau (Chest & Triceps)",
    plan_date: new Date("2026-08-18T00:00:00Z"),
    start_time: "18:00",
    duration_minutes: 60,
    note: "Tăng tạ ở hiệp cuối",
    is_completed: false,
    created_at: new Date("2026-08-17T12:00:00Z")
  },
  {
    user_id: uUser4Id,
    activity_name: "Lớp Yoga Hatha 60 phút",
    plan_date: new Date("2026-08-18T00:00:00Z"),
    start_time: "19:00",
    duration_minutes: 60,
    note: "Tập thở Pranayama và mở khớp háng",
    is_completed: false,
    created_at: new Date("2026-08-17T15:00:00Z")
  },
  {
    user_id: uUser1Id,
    activity_name: "Đi bộ nhẹ nhàng sau bữa tối",
    plan_date: new Date("2026-08-18T00:00:00Z"),
    start_time: "20:30",
    duration_minutes: 20,
    note: "Giúp tiêu hóa tốt hơn",
    is_completed: false,
    created_at: new Date("2026-08-17T16:00:00Z")
  }
]);

// ------------------------------------------------------------
// 15. MODULE F: GROCERY ITEMS (5 Documents)
// ------------------------------------------------------------
db.grocery_items.deleteMany({});
db.grocery_items.insertMany([
  {
    user_id: uUser1Id,
    ingredient_name: "Ức gà phi lê tươi",
    quantity: 500.0,
    unit: "g",
    is_purchased: false,
    source: "meal_plan",
    meal_plan_id: mp2Id,
    created_at: new Date("2026-08-17T10:05:00Z")
  },
  {
    user_id: uUser1Id,
    ingredient_name: "Yến mạch cán dẹt",
    quantity: 1.0,
    unit: "gói 500g",
    is_purchased: true,
    source: "meal_plan",
    meal_plan_id: mp1Id,
    created_at: new Date("2026-08-17T10:05:00Z")
  },
  {
    user_id: uUser1Id,
    ingredient_name: "Dầu ăn ô liu nguyên chất",
    quantity: 1.0,
    unit: "chai 500ml",
    is_purchased: false,
    source: "manual",
    meal_plan_id: null,
    created_at: new Date("2026-08-17T10:15:00Z")
  },
  {
    user_id: uUser2Id,
    ingredient_name: "Cá hồi tươi phi lê Na Uy",
    quantity: 300.0,
    unit: "g",
    is_purchased: false,
    source: "meal_plan",
    meal_plan_id: null,
    created_at: new Date("2026-08-17T14:30:00Z")
  },
  {
    user_id: uUser3Id,
    ingredient_name: "Thăn ngoại bò Úc Sirloin",
    quantity: 400.0,
    unit: "g",
    is_purchased: false,
    source: "meal_plan",
    meal_plan_id: null,
    created_at: new Date("2026-08-17T16:15:00Z")
  }
]);

// ------------------------------------------------------------
// 16. MODULE G: NOTIFICATIONS (5 Documents)
// ------------------------------------------------------------
db.notifications.deleteMany({});
db.notifications.insertMany([
  {
    user_id: uUser1Id,
    type: "meal_logged",
    title: "Ghi nhận bữa trưa thành công!",
    message: "Bạn đã nạp thêm 703 kcal từ Cơm tấm sườn nướng. Còn lại 579.5 kcal cho hôm nay.",
    reference_type: "meal_log",
    reference_id: mlLog2Id,
    is_read: true,
    created_at: new Date("2026-08-17T12:05:00Z")
  },
  {
    user_id: uUser1Id,
    type: "streak",
    title: "Chúc mừng chuỗi 7 ngày liên tiếp! 🔥",
    message: "Bạn đã duy trì mục tiêu calo trong 7 ngày liên tục. Tiếp tục phát huy nhé!",
    reference_type: "user_profile",
    reference_id: uUser1Id,
    is_read: false,
    created_at: new Date("2026-08-16T23:00:00Z")
  },
  {
    user_id: uUser2Id,
    type: "activity_reminder",
    title: "Đã đến giờ tập luyện! 💪",
    message: "Kế hoạch hôm nay: Tập mông đùi (Leg Day) lúc 07:00.",
    reference_type: "activity_plan",
    reference_id: null,
    is_read: true,
    created_at: new Date("2026-08-17T06:45:00Z")
  },
  {
    user_id: uUser3Id,
    type: "exceed_calories",
    title: "Cảnh báo Calo hôm nay ⚠️",
    message: "Bạn đã nạp đạt 95% mục tiêu Calo trong ngày. Hãy chú ý bữa ăn nhẹ buổi tối nhé!",
    reference_type: "meal_log",
    reference_id: null,
    is_read: false,
    created_at: new Date("2026-08-16T20:00:00Z")
  },
  {
    user_id: uUser4Id,
    type: "meal_reminder",
    title: "Đừng quên ghi nhật ký bữa tối 🥗",
    message: "Chụp ảnh hoặc mô tả bữa ăn để theo dõi lượng đạm và chất xơ trong ngày.",
    reference_type: "meal_log",
    reference_id: null,
    is_read: false,
    created_at: new Date("2026-08-16T19:30:00Z")
  }
]);

// ------------------------------------------------------------
// 17. MODULE H: POSTS (5 Documents)
// ------------------------------------------------------------
db.posts.deleteMany({});
db.posts.insertMany([
  {
    _id: pPost1Id,
    user_id: uUser2Id,
    content: "Món salad cá hồi bơ sáp mè rang tự làm tại nhà vừa ngon vừa chuẩn Eat Clean 🥑🐟 Mọi người thử ngay nhé!",
    recipe_id: rSaladCaHoiId,
    status: "visible",
    images: [
      { image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999", display_order: 1 }
    ],
    created_at: new Date("2026-08-12T14:30:00Z")
  },
  {
    _id: pPost2Id,
    user_id: uUser3Id,
    content: "Nạp đạm chất lượng sau buổi tập ngực với steak bò Úc măng tây siêu mọng nước 🥩💪",
    recipe_id: rBoBitTetId,
    status: "visible",
    images: [
      { image_url: "https://images.unsplash.com/photo-1544025162-d76694265947", display_order: 1 }
    ],
    created_at: new Date("2026-08-15T20:30:00Z")
  },
  {
    _id: pPost3Id,
    user_id: uUser4Id,
    content: "Bữa sáng cứu cánh cho những ngày lười dậy sớm: Yến mạch ngâm qua đêm chuối hạt chia 🍌🥣",
    recipe_id: rOvernightOatsId,
    status: "visible",
    images: [
      { image_url: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", display_order: 1 }
    ],
    created_at: new Date("2026-08-16T08:30:00Z")
  },
  {
    user_id: uUser1Id,
    content: "Hoàn thành thử thách 7 ngày không uống nước ngọt có ga! Cảm thấy cơ thể nhẹ nhõm hẳn ✨",
    recipe_id: null,
    status: "visible",
    images: [
      { image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2", display_order: 1 }
    ],
    created_at: new Date("2026-08-16T21:00:00Z")
  },
  {
    user_id: uUser2Id,
    content: "Chia sẻ thực đơn giảm cân 1 tuần cấp tốc giảm 10kg không cần tập thể dục",
    recipe_id: null,
    status: "pending", // Đang chờ kiểm duyệt nội dung y tế/giảm cân cực đoan
    images: [],
    created_at: new Date("2026-08-17T09:00:00Z")
  }
]);

// ------------------------------------------------------------
// 18. MODULE H: USER COLLECTIONS (5 Documents)
// ------------------------------------------------------------
db.user_collections.deleteMany({});
db.user_collections.insertMany([
  {
    user_id: uUser1Id,
    name: "Món ngon Giảm Mỡ Yêu Thích",
    items: [
      { item_type: "recipe", item_id: rUcGaApChaoId, added_at: new Date("2026-08-10T12:00:00Z") },
      { item_type: "recipe", item_id: rSaladCaHoiId, added_at: new Date("2026-08-11T15:00:00Z") },
      { item_type: "post", item_id: pPost1Id, added_at: new Date("2026-08-12T16:00:00Z") }
    ],
    created_at: new Date("2026-08-10T12:00:00Z")
  },
  {
    user_id: uUser2Id,
    name: "Thực Đơn Healthy Cho Nữ",
    items: [
      { item_type: "recipe", item_id: rSaladCaHoiId, added_at: new Date("2026-08-12T14:30:00Z") },
      { item_type: "recipe", item_id: rOvernightOatsId, added_at: new Date("2026-08-13T09:00:00Z") }
    ],
    created_at: new Date("2026-08-12T14:00:00Z")
  },
  {
    user_id: uUser3Id,
    name: "Món Giàu Protein Tăng Cơ",
    items: [
      { item_type: "recipe", item_id: rBoBitTetId, added_at: new Date("2026-08-15T20:30:00Z") },
      { item_type: "recipe", item_id: rUcGaApChaoId, added_at: new Date("2026-08-16T10:00:00Z") }
    ],
    created_at: new Date("2026-08-15T20:00:00Z")
  },
  {
    user_id: uUser4Id,
    name: "Món Chay & Eat Clean Thanh Đạm",
    items: [
      { item_type: "recipe", item_id: rOvernightOatsId, added_at: new Date("2026-08-16T08:30:00Z") },
      { item_type: "recipe", item_id: rCanhRongBienId, added_at: new Date("2026-08-16T11:00:00Z") }
    ],
    created_at: new Date("2026-08-16T08:00:00Z")
  },
  {
    user_id: uUser1Id,
    name: "Bữa Sáng Nhanh Tiện",
    items: [
      { item_type: "recipe", item_id: rOvernightOatsId, added_at: new Date("2026-08-17T07:30:00Z") }
    ],
    created_at: new Date("2026-08-17T07:30:00Z")
  }
]);

// ------------------------------------------------------------
// 19. MODULE I: MODERATION LOGS (5 Documents)
// ------------------------------------------------------------
db.moderation_logs.deleteMany({});
db.moderation_logs.insertMany([
  {
    admin_id: uAdminId,
    target_type: "recipe",
    target_id: rSaladCaHoiId,
    action: "approve",
    reason: "Công thức đầy đủ nguyên liệu, các bước rõ ràng và dinh dưỡng hợp lý.",
    created_at: new Date("2026-02-11T09:00:00Z")
  },
  {
    admin_id: uAdminId,
    target_type: "recipe",
    target_id: rBoBitTetId,
    action: "approve",
    reason: "Đã duyệt công thức của thành viên Lê Hoàng Nam.",
    created_at: new Date("2026-03-11T10:30:00Z")
  },
  {
    admin_id: uAdminId,
    target_type: "post",
    target_id: pPost1Id,
    action: "approve",
    reason: "Bài viết hình ảnh đẹp, nội dung tích cực.",
    created_at: new Date("2026-08-12T15:00:00Z")
  },
  {
    admin_id: uAdminId,
    target_type: "post",
    target_id: pPost2Id,
    action: "approve",
    reason: "Đã kiểm duyệt bài viết cộng đồng.",
    created_at: new Date("2026-08-15T21:00:00Z")
  },
  {
    admin_id: uAdminId,
    target_type: "post",
    target_id: pPost3Id,
    action: "approve",
    reason: "Nội dung phù hợp tiêu chuẩn cộng đồng.",
    created_at: new Date("2026-08-16T09:00:00Z")
  }
]);

// ============================================================
print("============================================================");
print("🎉 NẠP SEED DATA THÀNH CÔNG CHO TẤT CẢ COLLECTIONS!");
print("============================================================");
print("Thống kê số lượng documents đã nạp:");
print(" - users:                 " + db.users.countDocuments());
print(" - food_items:            " + db.food_items.countDocuments());
print(" - recognition_history:   " + db.recognition_history.countDocuments());
print(" - meal_logs:             " + db.meal_logs.countDocuments());
print(" - unidentified_foods:    " + db.unidentified_foods.countDocuments());
print(" - activities:            " + db.activities.countDocuments());
print(" - activity_logs:         " + db.activity_logs.countDocuments());
print(" - chat_conversations:    " + db.chat_conversations.countDocuments());
print(" - chat_messages:         " + db.chat_messages.countDocuments());
print(" - recipes:               " + db.recipes.countDocuments());
print(" - recipe_comments:       " + db.recipe_comments.countDocuments());
print(" - meal_plan_templates:   " + db.meal_plan_templates.countDocuments());
print(" - meal_plans:            " + db.meal_plans.countDocuments());
print(" - activity_plans:        " + db.activity_plans.countDocuments());
print(" - grocery_items:         " + db.grocery_items.countDocuments());
print(" - notifications:         " + db.notifications.countDocuments());
print(" - posts:                 " + db.posts.countDocuments());
print(" - user_collections:      " + db.user_collections.countDocuments());
print(" - moderation_logs:       " + db.moderation_logs.countDocuments());
print("============================================================");
