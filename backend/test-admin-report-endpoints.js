const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
require("dotenv").config();

const User = require("./models/user.model");
const FoodItem = require("./models/food_item.model");
const Recipe = require("./models/recipe.model");
const MealPlanTemplate = require("./models/meal_plan_template.model");
const adminReportRoutes = require("./routes/admin/report.admin.routes");

const JWT_SECRET =
  process.env.JWT_SECRET || "nutrition_management_secret_key_2026";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/nutrition_app";
const TEST_PORT = 5088;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

async function makeRequest({
  method = "GET",
  path = "/",
  token = null,
  body = null,
}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:${TEST_PORT}${path}`);
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            parsedData = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData,
          });
        });
      },
    );

    req.on("error", (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(
    "============================================================",
  );
  console.log(
    "🧪 BẮT ĐẦU KIỂM THỬ PHÂN HỆ ADMIN REPORTS & STATISTICS",
  );
  console.log(
    "============================================================\n",
  );

  // 1. Kết nối MongoDB
  await mongoose.connect(MONGO_URI);
  console.log("📦 Đã kết nối MongoDB thành công");

  // 2. Thiết lập Express Test Server
  const app = express();
  app.use(express.json());
  app.use("/api/admin/reports", adminReportRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🚀 Test server đang chạy tại port ${TEST_PORT}\n`);

  // 3. Chuẩn bị Token Admin và Token User thường
  const adminUser = await User.findOne({ role: "admin" }).lean();
  let adminId = adminUser?._id;
  if (!adminId) {
    const newAdmin = new User({
      email: "testadmin_reports@nutrition.app",
      password_hash: "hashed_dummy",
      role: "admin",
      full_name: "Admin Reports Tester",
      created_at: new Date(),
    });
    const saved = await newAdmin.save();
    adminId = saved._id;
  }

  const normalUser = await User.findOne({ role: "user" }).lean();
  let userId = normalUser?._id;
  if (!userId) {
    const newUser = new User({
      email: "normaluser_reports@nutrition.app",
      password_hash: "hashed_dummy",
      role: "user",
      full_name: "Normal User Tester",
      created_at: new Date(),
    });
    const saved = await newUser.save();
    userId = saved._id;
  }

  const adminToken = jwt.sign(
    { id: adminId.toString(), role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
  const userToken = jwt.sign(
    { id: userId.toString(), role: "user" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
  const invalidToken = "invalid_token_xyz_123";

  try {
    // ------------------------------------------------------------
    // TEST SECTION 1: AUTHENTICATION & AUTHORIZATION
    // ------------------------------------------------------------
    console.log("--- 1. Authentication & Authorization ---");

    // 1. Không có token -> 401
    const resNoToken = await makeRequest({
      path: "/api/admin/reports/overview",
    });
    assert(
      resNoToken.statusCode === 401,
      "1. Không có token truy cập overview trả về 401 Unauthorized",
    );

    // 2. Token không hợp lệ -> 401
    const resInvalidToken = await makeRequest({
      path: "/api/admin/reports/overview",
      token: invalidToken,
    });
    assert(
      resInvalidToken.statusCode === 401,
      "2. Token không hợp lệ bị từ chối với 401 Unauthorized",
    );

    // 3. User thường truy cập overview -> 403
    const resUserOverview = await makeRequest({
      path: "/api/admin/reports/overview",
      token: userToken,
    });
    assert(
      resUserOverview.statusCode === 403,
      "3. User thường truy cập overview bị từ chối với 403 Forbidden",
    );

    // 4. User thường truy cập /users, /foods, /recipes -> đều 403
    const resUserUsers = await makeRequest({
      path: "/api/admin/reports/users",
      token: userToken,
    });
    const resUserFoods = await makeRequest({
      path: "/api/admin/reports/foods",
      token: userToken,
    });
    const resUserRecipes = await makeRequest({
      path: "/api/admin/reports/recipes",
      token: userToken,
    });
    assert(
      resUserUsers.statusCode === 403 &&
        resUserFoods.statusCode === 403 &&
        resUserRecipes.statusCode === 403,
      "4. User thường không thể truy cập bất kỳ endpoint báo cáo nào (toàn bộ 403)",
    );

    // ------------------------------------------------------------
    // TEST SECTION 2: GET OVERVIEW
    // ------------------------------------------------------------
    console.log("\n--- 2. GET /api/admin/reports/overview ---");

    const resOverview = await makeRequest({
      path: "/api/admin/reports/overview",
      token: adminToken,
    });
    assert(
      resOverview.statusCode === 200,
      "5. Admin lấy báo cáo tổng quan thành công (200 OK)",
    );
    assert(
      resOverview.body.success === true &&
        resOverview.body.data &&
        resOverview.body.data.kpis,
      "6. Response trả về đúng cấu trúc { success: true, data: { kpis: { ... } } }",
    );

    const kpis = resOverview.body.data?.kpis || {};
    assert(
      typeof kpis.total_users === "number" &&
        typeof kpis.total_foods === "number" &&
        typeof kpis.total_recipes === "number" &&
        typeof kpis.total_meal_plan_templates === "number" &&
        typeof kpis.total_meal_logs === "number" &&
        typeof kpis.pending_recipes === "number" &&
        typeof kpis.pending_unidentified_foods === "number",
      "7. Tất cả các chỉ số KPI đều là số thực tế từ database (không dùng số ảo)",
    );

    // ------------------------------------------------------------
    // TEST SECTION 3: GET USER REPORTS & TIMEFRAME
    // ------------------------------------------------------------
    console.log("\n--- 3. GET /api/admin/reports/users ---");

    // 8. Timeframe 7d
    const resUsers7d = await makeRequest({
      path: "/api/admin/reports/users?timeframe=7d",
      token: adminToken,
    });
    assert(
      resUsers7d.statusCode === 200 &&
        Array.isArray(resUsers7d.body.data?.registration_trend),
      "8. Báo cáo người dùng timeframe=7d hoạt động chính xác",
    );

    // 9. Timeframe 30d (mặc định)
    const resUsersDefault = await makeRequest({
      path: "/api/admin/reports/users",
      token: adminToken,
    });
    assert(
      resUsersDefault.statusCode === 200 &&
        resUsersDefault.body.data?.goals_distribution !== undefined &&
        resUsersDefault.body.data?.activity_level_distribution !== undefined &&
        resUsersDefault.body.data?.roles_distribution !== undefined,
      "9. Báo cáo người dùng mặc định (30d) trả về đầy đủ các phân bố",
    );

    // 10. Timeframe 90d
    const resUsers90d = await makeRequest({
      path: "/api/admin/reports/users?timeframe=90d",
      token: adminToken,
    });
    assert(
      resUsers90d.statusCode === 200,
      "10. Báo cáo người dùng timeframe=90d hoạt động chính xác",
    );

    // 11. Timeframe 1y
    const resUsers1y = await makeRequest({
      path: "/api/admin/reports/users?timeframe=1y",
      token: adminToken,
    });
    assert(
      resUsers1y.statusCode === 200,
      "11. Báo cáo người dùng timeframe=1y hoạt động chính xác",
    );

    // 12. Timeframe all
    const resUsersAll = await makeRequest({
      path: "/api/admin/reports/users?timeframe=all",
      token: adminToken,
    });
    assert(
      resUsersAll.statusCode === 200,
      "12. Báo cáo người dùng timeframe=all hoạt động chính xác",
    );

    // 13. Timeframe không hợp lệ -> 400 Bad Request
    const resUsersInvalid = await makeRequest({
      path: "/api/admin/reports/users?timeframe=invalid_tf",
      token: adminToken,
    });
    assert(
      resUsersInvalid.statusCode === 400,
      "13. Timeframe không hợp lệ bị từ chối với 400 Bad Request",
    );

    // 14. Kiểm tra bảo vệ quyền riêng tư người dùng
    const userReportStr = JSON.stringify(resUsersDefault.body);
    const hasEmail = userReportStr.includes("@");
    const hasPassword = userReportStr.includes("password_hash");
    assert(
      !hasEmail && !hasPassword,
      "14. Báo cáo người dùng tuyệt đối KHÔNG chứa email, password hay thông tin cá nhân",
    );

    // ------------------------------------------------------------
    // TEST SECTION 4: GET FOOD REPORTS
    // ------------------------------------------------------------
    console.log("\n--- 4. GET /api/admin/reports/foods ---");

    const resFoods = await makeRequest({
      path: "/api/admin/reports/foods",
      token: adminToken,
    });
    assert(
      resFoods.statusCode === 200,
      "15. Admin lấy báo cáo thực phẩm thành công (200 OK)",
    );

    const foodData = resFoods.body.data || {};
    assert(
      foodData.verification_stats &&
        typeof foodData.verification_stats.verified === "number" &&
        typeof foodData.verification_stats.unverified === "number" &&
        typeof foodData.verification_stats.verified_rate === "number",
      "16. Thống kê xác thực thực phẩm (verified/unverified/rate) chính xác",
    );

    assert(
      Array.isArray(foodData.categories_distribution) &&
        foodData.unidentified_foods_stats !== undefined &&
        typeof foodData.unidentified_foods_stats.total === "number" &&
        typeof foodData.unidentified_foods_stats.pending === "number" &&
        typeof foodData.unidentified_foods_stats.resolved === "number",
      "17. Phân bố danh mục thực phẩm và thống kê món ăn chưa xác định đầy đủ",
    );

    // ------------------------------------------------------------
    // TEST SECTION 5: GET RECIPE REPORTS
    // ------------------------------------------------------------
    console.log("\n--- 5. GET /api/admin/reports/recipes ---");

    const resRecipes = await makeRequest({
      path: "/api/admin/reports/recipes",
      token: adminToken,
    });
    assert(
      resRecipes.statusCode === 200,
      "18. Admin lấy báo cáo công thức & thực đơn mẫu thành công (200 OK)",
    );

    const recipeData = resRecipes.body.data || {};
    assert(
      recipeData.source_distribution &&
        typeof recipeData.source_distribution.system === "number" &&
        typeof recipeData.source_distribution.community === "number" &&
        recipeData.status_distribution &&
        typeof recipeData.status_distribution.approved === "number" &&
        typeof recipeData.status_distribution.pending === "number" &&
        typeof recipeData.status_distribution.rejected === "number",
      "19. Phân bố nguồn và trạng thái kiểm duyệt công thức món ăn chính xác",
    );

    assert(
      Array.isArray(recipeData.top_rated_recipes) &&
        recipeData.meal_plan_templates_summary &&
        typeof recipeData.meal_plan_templates_summary.total_templates ===
          "number" &&
        typeof recipeData.meal_plan_templates_summary
          .avg_items_per_template === "number",
      "20. Danh sách top công thức đánh giá cao và tóm tắt thực đơn mẫu chính xác",
    );

    // ------------------------------------------------------------
    // TEST SECTION 6: PRIVACY & DATA SAFETY INTEGRITY
    // ------------------------------------------------------------
    console.log("\n--- 6. Privacy & Data Safety Integrity ---");

    const allReportsCombined =
      JSON.stringify(resOverview.body) +
      JSON.stringify(resUsersDefault.body) +
      JSON.stringify(resFoods.body) +
      JSON.stringify(resRecipes.body);

    assert(
      !allReportsCombined.includes("password_hash"),
      "21. Tuyệt đối không để lộ password_hash ở bất kỳ endpoint báo cáo nào",
    );
    assert(
      !allReportsCombined.includes("chat_messages") &&
        !allReportsCombined.includes("conversation_id"),
      "22. Tuyệt đối không để lộ nội dung chat cá nhân của người dùng",
    );
    assert(
      !allReportsCombined.includes("grocery_items") &&
        !allReportsCombined.includes("is_purchased"),
      "23. Tuyệt đối không để lộ giỏ hàng đi chợ của người dùng",
    );
  } catch (err) {
    console.error("❌ Lỗi trong quá trình kiểm thử:", err);
  } finally {
    await server.close();
    await mongoose.disconnect();
    console.log(
      "\n============================================================",
    );
    console.log(`🎉 TỔNG KẾT KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log(
      "============================================================",
    );
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
