// ==============================================================================
// SEED SCRIPT: MÔ PHỎNG CÁC TRƯỜNG HỢP DUY TRÌ MỤC TIÊU & ĐỘ TUÂN THỦ KẾ HOẠCH
//
// File này độc lập hoàn toàn, ghi trực tiếp vào MongoDB, KHÔNG sửa file backend chính.
//
// Cách chạy:
//   node database/seed-goal-adherence.js
//
// Tùy chọn nạp kịch bản vào 1 user cụ thể:
//   node database/seed-goal-adherence.js --email=vvvv@gmail.com --scenario=deviated
//   (Các kịch bản: ontrack | deviated | undertarget | missed)
// ==============================================================================

let mongoose, bcrypt;
try {
  mongoose = require('mongoose');
} catch {
  mongoose = require('../backend/node_modules/mongoose');
}
try {
  bcrypt = require('bcryptjs');
} catch {
  bcrypt = require('../backend/node_modules/bcryptjs');
}

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/nutrition_app';

const PASSWORD_PLAIN = 'User@123';

// Mẫu đồ ăn và dinh dưỡng thực tế
const SAMPLE_MEALS = {
  breakfast: [
    { desc: 'Phở bò tái nạm hành hoa', cal: 520, protein: 32, carb: 65, fat: 14 },
    { desc: 'Yến mạch ngâm sữa chua & hoa quả hạt', cal: 420, protein: 22, carb: 58, fat: 10 },
    { desc: 'Bánh mì ốp la 2 trứng & bơ tươi', cal: 460, protein: 20, carb: 45, fat: 22 },
  ],
  lunch: [
    { desc: 'Cơm gạo lứt + ức gà áp chảo sốt chanh leo + súp lơ luộc', cal: 580, protein: 48, carb: 65, fat: 12 },
    { desc: 'Cơm tấm sườn bì chả nướng', cal: 720, protein: 35, carb: 88, fat: 25 },
    { desc: 'Bún chả Hà Nội nướng than hoa', cal: 610, protein: 32, carb: 75, fat: 20 },
  ],
  dinner: [
    { desc: 'Salad cá hồi áp chảo sốt mè rang dầu ô liu', cal: 510, protein: 42, carb: 24, fat: 28 },
    { desc: 'Bò bít tết thăn ngoại + khoai tây nướng + măng tây', cal: 630, protein: 46, carb: 40, fat: 30 },
    { desc: 'Canh rong biển đậu hũ thịt bằm + rau củ luộc', cal: 360, protein: 28, carb: 30, fat: 12 },
  ],
  snack: [
    { desc: 'Sinh tố bơ chuối hạt chia', cal: 280, protein: 8, carb: 36, fat: 12 },
    { desc: 'Sữa chua Hy Lạp mix hạt điều hạnh nhân', cal: 220, protein: 16, carb: 18, fat: 9 },
    { desc: 'Táo tươi & một muỗng bơ đậu phộng', cal: 190, protein: 5, carb: 26, fat: 8 },
  ],
  // Món thừa calo cho kịch bản vượt mức
  overload_lunch: [
    { desc: 'Lẩu hải sản bò Mỹ buffet + trà sữa phô mai trân châu', cal: 1450, protein: 65, carb: 160, fat: 62 },
    { desc: 'Gà rán giòn cay 4 miếng + khoai tây chiên cỡ lớn + nước ngọt', cal: 1380, protein: 52, carb: 145, fat: 68 },
  ],
  overload_dinner: [
    { desc: 'Tiệc nướng BBQ sườn bò nướng phô mai + bia lạnh', cal: 1250, protein: 58, carb: 85, fat: 72 },
    { desc: 'Pizza phô mai xúc xích cỡ lớn + mì Ý sốt kem', cal: 1320, protein: 45, carb: 155, fat: 58 },
  ],
};

function getDayDate(daysAgo, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ------------------------------------------------------------------------------
// Seed hàm xây dựng lịch sử cho 1 user theo kịch bản
// ------------------------------------------------------------------------------
async function generateScenarioData(db, user, scenario, foodItems, recipes, templates) {
  const userId = user._id;
  const targetCalories = user.target_calories || 2000;

  console.log(`\n⚙️  Đang nạp dữ liệu cho user: [${user.email}] (${user.full_name})`);
  console.log(`    Mục tiêu: ${user.goal}, Calo mục tiêu: ${targetCalories} kcal/ngày`);
  console.log(`    Kịch bản: [${scenario.toUpperCase()}]`);

  // Xóa meal_logs và meal_plans 14 ngày gần nhất của user này để làm sạch
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  await db.collection('meal_logs').deleteMany({
    user_id: userId,
    logged_at: { $gte: fourteenDaysAgo },
  });

  await db.collection('meal_plans').deleteMany({
    user_id: userId,
    plan_date: { $gte: fourteenDaysAgo },
  });

  const logsToInsert = [];
  const plansToInsert = [];

  const sampleFood = foodItems[0] || null;
  const sampleRecipe = recipes[0] || null;

  // Mô phỏng 7 ngày qua: từ 6 ngày trước (daysAgo = 6) đến hôm nay (daysAgo = 0)
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const planDate = getDayDate(daysAgo, 8);

    // Tạo kế hoạch món mẫu cho ngày này
    const dayMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (const mt of dayMealTypes) {
      plansToInsert.push({
        user_id: userId,
        plan_date: planDate,
        meal_type: mt,
        recipe_id: sampleRecipe ? sampleRecipe._id : null,
        food_item_id: sampleFood ? sampleFood._id : null,
        source: 'template',
        is_logged: scenario === 'missed' ? false : true,
        created_at: fourteenDaysAgo,
      });
    }

    // Tùy theo kịch bản để sinh logs ăn uống:
    if (scenario === 'ontrack') {
      // 🟢 Kịch bản 1: Tuân thủ rất tốt (calo 90% - 105% mục tiêu)
      const bMeal = SAMPLE_MEALS.breakfast[daysAgo % SAMPLE_MEALS.breakfast.length];
      const lMeal = SAMPLE_MEALS.lunch[daysAgo % SAMPLE_MEALS.lunch.length];
      const dMeal = SAMPLE_MEALS.dinner[daysAgo % SAMPLE_MEALS.dinner.length];

      // Tinh chỉnh calo cho khớp khoảng 95-102% target
      const dailyCal = bMeal.cal + lMeal.cal + dMeal.cal;
      const ratio = targetCalories / dailyCal;

      logsToInsert.push({
        user_id: userId,
        input_method: 'text',
        description_text: bMeal.desc,
        calories: Math.round(bMeal.cal * ratio * 0.98),
        protein_g: Math.round(bMeal.protein * ratio),
        carb_g: Math.round(bMeal.carb * ratio),
        fat_g: Math.round(bMeal.fat * ratio),
        meal_type: 'breakfast',
        logged_at: getDayDate(daysAgo, 7),
        created_at: getDayDate(daysAgo, 7),
      });

      logsToInsert.push({
        user_id: userId,
        input_method: 'photo',
        description_text: lMeal.desc,
        calories: Math.round(lMeal.cal * ratio * 1.01),
        protein_g: Math.round(lMeal.protein * ratio),
        carb_g: Math.round(lMeal.carb * ratio),
        fat_g: Math.round(lMeal.fat * ratio),
        meal_type: 'lunch',
        logged_at: getDayDate(daysAgo, 12),
        created_at: getDayDate(daysAgo, 12),
      });

      logsToInsert.push({
        user_id: userId,
        input_method: 'text',
        description_text: dMeal.desc,
        calories: Math.round(dMeal.cal * ratio * 0.99),
        protein_g: Math.round(dMeal.protein * ratio),
        carb_g: Math.round(dMeal.carb * ratio),
        fat_g: Math.round(dMeal.fat * ratio),
        meal_type: 'dinner',
        logged_at: getDayDate(daysAgo, 19),
        created_at: getDayDate(daysAgo, 19),
      });
    } else if (scenario === 'deviated') {
      // 🔴 Kịch bản 2: Lệch kế hoạch liên tiếp >= 3 ngày (Ăn vượt calo nghiêm trọng)
      if (daysAgo >= 4) {
        // Những ngày đầu tuần: ăn ngoan ngoãn đúng mục tiêu
        const bMeal = SAMPLE_MEALS.breakfast[0];
        const lMeal = SAMPLE_MEALS.lunch[0];
        const dMeal = SAMPLE_MEALS.dinner[0];

        logsToInsert.push({
          user_id: userId,
          input_method: 'text',
          description_text: bMeal.desc,
          calories: bMeal.cal,
          protein_g: bMeal.protein,
          carb_g: bMeal.carb,
          fat_g: bMeal.fat,
          meal_type: 'breakfast',
          logged_at: getDayDate(daysAgo, 7),
          created_at: getDayDate(daysAgo, 7),
        });
        logsToInsert.push({
          user_id: userId,
          input_method: 'photo',
          description_text: lMeal.desc,
          calories: lMeal.cal,
          protein_g: lMeal.protein,
          carb_g: lMeal.carb,
          fat_g: lMeal.fat,
          meal_type: 'lunch',
          logged_at: getDayDate(daysAgo, 12),
          created_at: getDayDate(daysAgo, 12),
        });
        logsToInsert.push({
          user_id: userId,
          input_method: 'text',
          description_text: dMeal.desc,
          calories: dMeal.cal,
          protein_g: dMeal.protein,
          carb_g: dMeal.carb,
          fat_g: dMeal.fat,
          meal_type: 'dinner',
          logged_at: getDayDate(daysAgo, 19),
          created_at: getDayDate(daysAgo, 19),
        });
      } else {
        // 3 ngày gần nhất (daysAgo = 2, 1, 0) + daysAgo = 3: Ăn tiệc, buffet, vượt > 140% calo mục tiêu!
        const bMeal = SAMPLE_MEALS.breakfast[1];
        const overLunch = SAMPLE_MEALS.overload_lunch[daysAgo % 2];
        const overDinner = SAMPLE_MEALS.overload_dinner[daysAgo % 2];

        logsToInsert.push({
          user_id: userId,
          input_method: 'text',
          description_text: bMeal.desc,
          calories: bMeal.cal,
          protein_g: bMeal.protein,
          carb_g: bMeal.carb,
          fat_g: bMeal.fat,
          meal_type: 'breakfast',
          logged_at: getDayDate(daysAgo, 8),
          created_at: getDayDate(daysAgo, 8),
        });
        logsToInsert.push({
          user_id: userId,
          input_method: 'photo',
          description_text: overLunch.desc,
          calories: overLunch.cal,
          protein_g: overLunch.protein,
          carb_g: overLunch.carb,
          fat_g: overLunch.fat,
          meal_type: 'lunch',
          logged_at: getDayDate(daysAgo, 13),
          created_at: getDayDate(daysAgo, 13),
        });
        logsToInsert.push({
          user_id: userId,
          input_method: 'text',
          description_text: overDinner.desc,
          calories: overDinner.cal,
          protein_g: overDinner.protein,
          carb_g: overDinner.carb,
          fat_g: overDinner.fat,
          meal_type: 'dinner',
          logged_at: getDayDate(daysAgo, 20),
          created_at: getDayDate(daysAgo, 20),
        });
      }
    } else if (scenario === 'undertarget') {
      // 🟡 Kịch bản 3: Ăn thiếu calo nghiêm trọng (< 60% mục tiêu trong nhiều ngày)
      const bMeal = SAMPLE_MEALS.breakfast[2];
      const dMeal = SAMPLE_MEALS.dinner[2];

      logsToInsert.push({
        user_id: userId,
        input_method: 'text',
        description_text: 'Chỉ uống 1 cốc nước ép táo và ăn nửa quả táo',
        calories: 140,
        protein_g: 2,
        carb_g: 32,
        fat_g: 0,
        meal_type: 'breakfast',
        logged_at: getDayDate(daysAgo, 8),
        created_at: getDayDate(daysAgo, 8),
      });

      logsToInsert.push({
        user_id: userId,
        input_method: 'text',
        description_text: dMeal.desc,
        calories: dMeal.cal,
        protein_g: dMeal.protein,
        carb_g: dMeal.carb,
        fat_g: dMeal.fat,
        meal_type: 'dinner',
        logged_at: getDayDate(daysAgo, 18),
        created_at: getDayDate(daysAgo, 18),
      });
      // Tổng chỉ ~500 - 650 kcal, dưới 70% mục tiêu
    } else if (scenario === 'missed') {
      // ⭕ Kịch bản 4: Có kế hoạch nhưng 4 ngày gần nhất không ghi nhận (0 kcal, missed_plan)
      if (daysAgo >= 4) {
        // 2 ngày đầu có ăn
        const lMeal = SAMPLE_MEALS.lunch[1];
        logsToInsert.push({
          user_id: userId,
          input_method: 'photo',
          description_text: lMeal.desc,
          calories: targetCalories,
          protein_g: 60,
          carb_g: 150,
          fat_g: 30,
          meal_type: 'lunch',
          logged_at: getDayDate(daysAgo, 12),
          created_at: getDayDate(daysAgo, 12),
        });
      }
      // daysAgo 3, 2, 1, 0 không có bất kỳ log nào -> bỏ lỡ kế hoạch
    }
  }

  if (plansToInsert.length > 0) {
    await db.collection('meal_plans').insertMany(plansToInsert);
  }

  if (logsToInsert.length > 0) {
    await db.collection('meal_logs').insertMany(logsToInsert);
  }

  console.log(`    ✅ Đã tạo thành công ${plansToInsert.length} món kế hoạch và ${logsToInsert.length} log bữa ăn.`);
}

// ------------------------------------------------------------------------------
// Main Seeder
// ------------------------------------------------------------------------------
async function runSeed() {
  console.log('================================================================');
  console.log('🌱 BẮT ĐẦU CHẠY SEED DATA MÔ PHỎNG TIẾN ĐỘ & TUÂN THỦ MỤC TIÊU');
  console.log('================================================================');
  console.log(`Connecting to: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

  // 1. Lấy thực đơn mẫu và thức ăn mẫu có sẵn
  const foodItems = await db.collection('food_items').find({}).limit(5).toArray();
  const recipes = await db.collection('recipes').find({}).limit(5).toArray();
  const templates = await db.collection('meal_plan_templates').find({}).limit(5).toArray();

  // 2. Danh sách 4 tài khoản mô phỏng đại diện cho 4 trường hợp
  const scenarioAccounts = [
    {
      email: 'ontrack@nutrition.app',
      full_name: 'Nguyễn Tuân Thủ (Mẫu Tuân Thủ Tốt)',
      goal: 'lose',
      target_calories: 1800,
      target_protein_g: 135,
      target_carb_g: 180,
      target_fat_g: 50,
      height_cm: 172,
      weight_kg: 76,
      scenario: 'ontrack',
    },
    {
      email: 'deviated@nutrition.app',
      full_name: 'Trần Vượt Calo (Mẫu Lệch > 3 Ngày)',
      goal: 'lose',
      target_calories: 1700,
      target_protein_g: 130,
      target_carb_g: 170,
      target_fat_g: 47,
      height_cm: 170,
      weight_kg: 80,
      scenario: 'deviated',
    },
    {
      email: 'undertarget@nutrition.app',
      full_name: 'Lê Thiếu Năng Lượng (Mẫu Ăn Thiếu Calo)',
      goal: 'lose',
      target_calories: 2000,
      target_protein_g: 140,
      target_carb_g: 220,
      target_fat_g: 55,
      height_cm: 165,
      weight_kg: 68,
      scenario: 'undertarget',
    },
    {
      email: 'missed@nutrition.app',
      full_name: 'Hoàng Bỏ Lỡ (Mẫu Bỏ Lỡ Thực Đơn)',
      goal: 'maintain',
      target_calories: 2200,
      target_protein_g: 130,
      target_carb_g: 250,
      target_fat_g: 65,
      height_cm: 175,
      weight_kg: 70,
      scenario: 'missed',
    },
  ];

  // 3. Tạo hoặc cập nhật 4 tài khoản trên
  for (const acc of scenarioAccounts) {
    let user = await db.collection('users').findOne({ email: acc.email });
    if (!user) {
      const insertResult = await db.collection('users').insertOne({
        email: acc.email,
        password_hash: passwordHash,
        full_name: acc.full_name,
        role: 'user',
        gender: 'male',
        date_of_birth: new Date('1998-05-15'),
        height_cm: acc.height_cm,
        weight_kg: acc.weight_kg,
        activity_level: 'moderate',
        goal: acc.goal,
        target_calories: acc.target_calories,
        target_protein_g: acc.target_protein_g,
        target_carb_g: acc.target_carb_g,
        target_fat_g: acc.target_fat_g,
        created_at: new Date(),
        updated_at: new Date(),
      });
      user = await db.collection('users').findOne({ _id: insertResult.insertedId });
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            password_hash: passwordHash,
            full_name: acc.full_name,
            goal: acc.goal,
            target_calories: acc.target_calories,
            target_protein_g: acc.target_protein_g,
            target_carb_g: acc.target_carb_g,
            target_fat_g: acc.target_fat_g,
            updated_at: new Date(),
          },
        }
      );
      user = await db.collection('users').findOne({ _id: user._id });
    }

    await generateScenarioData(db, user, acc.scenario, foodItems, recipes, templates);
  }

  // 4. Kiểm tra xem người dùng có truyền tham số CLI nạp trực tiếp vào tài khoản cụ thể không
  const args = process.argv.slice(2);
  let targetEmail = null;
  let customScenario = 'deviated'; // Mặc định là trường hợp lệch để kiểm tra Modal cảnh báo

  for (const arg of args) {
    if (arg.startsWith('--email=')) targetEmail = arg.split('=')[1].trim();
    if (arg.startsWith('--scenario=')) customScenario = arg.split('=')[1].trim();
  }

  // Nếu không truyền email, tự động tìm tài khoản user gần đây nhất (đang đăng nhập hoặc test trên máy)
  // để nạp kịch bản 'deviated' giúp người dùng refresh là thấy ngay kết quả trên app!
  if (!targetEmail) {
    const recentUser = await db
      .collection('users')
      .find({ email: { $nin: scenarioAccounts.map((a) => a.email).concat(['admin@nutrition.app']) } })
      .sort({ updated_at: -1, _id: -1 })
      .limit(1)
      .toArray();

    if (recentUser.length > 0) {
      targetEmail = recentUser[0].email;
      console.log(`\n🎯 Tự động phát hiện tài khoản người dùng đang hoạt động: [${targetEmail}]`);
    }
  }

  if (targetEmail) {
    const activeUser = await db.collection('users').findOne({ email: targetEmail });
    if (activeUser) {
      // Đảm bảo user có target_calories
      if (!activeUser.target_calories) {
        await db.collection('users').updateOne(
          { _id: activeUser._id },
          { $set: { target_calories: 2000, goal: activeUser.goal || 'lose', updated_at: new Date() } }
        );
        activeUser.target_calories = 2000;
        activeUser.goal = activeUser.goal || 'lose';
      }

      console.log(`\n🔥 Nạp kịch bản [${customScenario.toUpperCase()}] vào tài khoản đang dùng: [${targetEmail}]`);
      await generateScenarioData(db, activeUser, customScenario, foodItems, recipes, templates);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ĐÃ NẠP SEED DATA THÀNH CÔNG VÀO MONGODB RIÊNG BIỆT!');
  console.log('================================================================');
  console.log('\n📋 BẠN CÓ THỂ ĐĂNG NHẬP HOẶC KIỂM TRA CÁC TÀI KHOẢN MẪU:');
  console.log('----------------------------------------------------------------');
  console.log('1️⃣  Tuân thủ xuất sắc (Chuỗi xanh lá, 100% On-Track):');
  console.log('    👉 Email: ontrack@nutrition.app | Mật khẩu: User@123');
  console.log('----------------------------------------------------------------');
  console.log('2️⃣  Lệch kế hoạch > 3 ngày (Kích hoạt Popup Modal Cảnh báo & Đề xuất):');
  console.log('    👉 Email: deviated@nutrition.app | Mật khẩu: User@123');
  console.log('----------------------------------------------------------------');
  console.log('3️⃣  Ăn thiếu calo liên tục (< 60% mục tiêu, Cảnh báo vàng):');
  console.log('    👉 Email: undertarget@nutrition.app | Mật khẩu: User@123');
  console.log('----------------------------------------------------------------');
  console.log('4️⃣  Bỏ lỡ thực đơn kế hoạch (0 kcal, Cảnh báo đỏ):');
  console.log('    👉 Email: missed@nutrition.app | Mật khẩu: User@123');
  console.log('----------------------------------------------------------------');
  if (targetEmail) {
    console.log(`5️⃣  Tài khoản trên app của bạn [${targetEmail}]:`);
    console.log(`    👉 Đã được nạp kịch bản [${customScenario.toUpperCase()}]. Chỉ cần kéo thả Refresh trang là thấy ngay!`);
    console.log('----------------------------------------------------------------');
  }

  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Lỗi trong quá trình Seed data:', err);
  process.exit(1);
});
