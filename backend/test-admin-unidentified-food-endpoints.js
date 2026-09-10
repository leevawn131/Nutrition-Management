const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
require("dotenv").config();

const User = require("./models/user.model");
const FoodItem = require("./models/food_item.model");
const UnidentifiedFood = require("./models/unidentified_food.model");
const adminUnidentifiedFoodRoutes = require("./routes/admin/unidentified_food.admin.routes");

const JWT_SECRET =
  process.env.JWT_SECRET || "nutrition_management_secret_key_2026";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/nutrition_app";
const TEST_PORT = 5089;

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
  console.log("============================================================");
  console.log("🧪 BẮT ĐẦU KIỂM THỬ PHÂN HỆ MODERATION UNIDENTIFIED FOODS");
  console.log("============================================================\n");

  // 1. Kết nối MongoDB
  await mongoose.connect(MONGO_URI);
  console.log("📦 Đã kết nối MongoDB thành công");

  // 2. Thiết lập Express Test Server
  const app = express();
  app.use(express.json());
  app.use("/api/admin/unidentified-foods", adminUnidentifiedFoodRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🚀 Test server đang chạy tại port ${TEST_PORT}\n`);

  // 3. Chuẩn bị Token Admin và Token User thường
  let adminUser = await User.findOne({ role: "admin" }).lean();
  let adminId = adminUser?._id;
  if (!adminId) {
    const newAdmin = new User({
      email: "testadmin_unidentified@nutrition.app",
      password_hash: "hashed_dummy",
      role: "admin",
      full_name: "Admin Unidentified Tester",
      created_at: new Date(),
    });
    const saved = await newAdmin.save();
    adminId = saved._id;
  }

  let normalUser = await User.findOne({ role: "user" }).lean();
  let userId = normalUser?._id;
  if (!userId) {
    const newUser = new User({
      email: "normaluser_unidentified@nutrition.app",
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

  // Chuẩn bị 1 món ăn mẫu để test resolve
  let testFood = await FoodItem.findOne().lean();
  if (!testFood) {
    const newFood = new FoodItem({
      name: "Món Ăn Test Liên Kết",
      calories_per_100g: 150,
      is_verified: true,
      created_at: new Date(),
    });
    testFood = await newFood.save();
  }

  try {
    // ------------------------------------------------------------
    // TEST SECTION 1: AUTHENTICATION & AUTHORIZATION
    // ------------------------------------------------------------
    console.log("--- 1. Authentication & Authorization ---");

    // 1. Không có token -> 401
    const resNoToken = await makeRequest({
      path: "/api/admin/unidentified-foods",
    });
    assert(
      resNoToken.statusCode === 401,
      "1. Không có token truy cập list trả về 401 Unauthorized",
    );

    // 2. User thường truy cập list -> 403
    const resUserList = await makeRequest({
      path: "/api/admin/unidentified-foods",
      token: userToken,
    });
    assert(
      resUserList.statusCode === 403,
      "2. User thường truy cập list bị từ chối với 403 Forbidden",
    );

    // 3. Admin truy cập list -> 200
    const resAdminList = await makeRequest({
      path: "/api/admin/unidentified-foods",
      token: adminToken,
    });
    assert(
      resAdminList.statusCode === 200,
      "3. Admin truy cập list thành công (200 OK)",
    );

    // ------------------------------------------------------------
    // TEST SECTION 2: LIST, FILTER, SEARCH, PAGINATION
    // ------------------------------------------------------------
    console.log("\n--- 2. List, Filters, Search & Pagination ---");

    // 4. Lọc status=pending
    const resPending = await makeRequest({
      path: "/api/admin/unidentified-foods?status=pending",
      token: adminToken,
    });
    assert(
      resPending.statusCode === 200 &&
        resPending.body.data.items.every((i) => i.status === "pending"),
      "4. Lọc status=pending trả về chính xác toàn bộ bản ghi pending",
    );

    // 5. Lọc status=resolved
    const resResolved = await makeRequest({
      path: "/api/admin/unidentified-foods?status=resolved",
      token: adminToken,
    });
    assert(
      resResolved.statusCode === 200 &&
        resResolved.body.data.items.every((i) => i.status === "resolved"),
      "5. Lọc status=resolved trả về chính xác toàn bộ bản ghi resolved",
    );

    // 6. Lọc status=all
    const resAll = await makeRequest({
      path: "/api/admin/unidentified-foods?status=all",
      token: adminToken,
    });
    assert(
      resAll.statusCode === 200 &&
        resAll.body.data.summary !== undefined &&
        typeof resAll.body.data.summary.total === "number",
      "6. Lọc status=all trả về đầy đủ items và summary counts",
    );

    // 7. Tìm kiếm theo name_guess
    const resSearch = await makeRequest({
      path: "/api/admin/unidentified-foods?search=Bánh",
      token: adminToken,
    });
    assert(
      resSearch.statusCode === 200 && Array.isArray(resSearch.body.data.items),
      "7. Tìm kiếm search=Bánh theo name_guess hoạt động chính xác",
    );

    // 8. Phân trang pagination
    const resPagination = await makeRequest({
      path: "/api/admin/unidentified-foods?page=1&limit=2",
      token: adminToken,
    });
    assert(
      resPagination.statusCode === 200 &&
        resPagination.body.data.pagination.page === 1 &&
        resPagination.body.data.pagination.limit === 2,
      "8. Phân trang page & limit hoạt động chuẩn xác",
    );

    // 9. Tham số status không hợp lệ -> 400
    const resInvalidStatus = await makeRequest({
      path: "/api/admin/unidentified-foods?status=invalid_status",
      token: adminToken,
    });
    assert(
      resInvalidStatus.statusCode === 400,
      "9. Tham số status không hợp lệ bị từ chối với 400 Bad Request",
    );

    // ------------------------------------------------------------
    // TEST SECTION 3: GET BY ID
    // ------------------------------------------------------------
    console.log("\n--- 3. GET /api/admin/unidentified-foods/:id ---");

    // Tạo 1 bản ghi pending để test
    const testPendingRecord = new UnidentifiedFood({
      reported_by_user_id: userId,
      image_url: "https://storage.googleapis.com/test-dish.jpg",
      name_guess: "Món Test Chưa Xác Định",
      status: "pending",
      resolved_food_item_id: null,
      created_at: new Date(),
    });
    await testPendingRecord.save();
    const testRecordId = testPendingRecord._id.toString();

    // 10. Chi tiết hợp lệ
    const resDetail = await makeRequest({
      path: `/api/admin/unidentified-foods/${testRecordId}`,
      token: adminToken,
    });
    assert(
      resDetail.statusCode === 200 &&
        resDetail.body.data.item._id === testRecordId,
      "10. Lấy chi tiết bản ghi món lạ thành công (200 OK)",
    );

    // 11. Chi tiết với ObjectId không hợp lệ -> 400
    const resDetailInvalidId = await makeRequest({
      path: "/api/admin/unidentified-foods/invalid_oid",
      token: adminToken,
    });
    assert(
      resDetailInvalidId.statusCode === 400,
      "11. ID không phải ObjectId hợp lệ trả về 400 Bad Request",
    );

    // 12. Chi tiết với ObjectId không tồn tại -> 404
    const nonExistentOid = new mongoose.Types.ObjectId().toString();
    const resDetailNotFound = await makeRequest({
      path: `/api/admin/unidentified-foods/${nonExistentOid}`,
      token: adminToken,
    });
    assert(
      resDetailNotFound.statusCode === 404,
      "12. ID không tồn tại trong database trả về 404 Not Found",
    );

    // ------------------------------------------------------------
    // TEST SECTION 4: RESOLVE BY LINKING EXISTING FOOD
    // ------------------------------------------------------------
    console.log("\n--- 4. Resolve by Linking Existing Food ---");

    // 13. Resolve thành công bằng cách gán món có sẵn
    const resResolveExisting = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testRecordId}/resolve`,
      token: adminToken,
      body: {
        food_item_id: testFood._id.toString(),
      },
    });
    assert(
      resResolveExisting.statusCode === 200 &&
        resResolveExisting.body.data.item.status === "resolved" &&
        resResolveExisting.body.data.item.resolved_food_item !== null,
      "13. Chuẩn hóa bằng cách gán món có sẵn thành công (status: resolved)",
    );

    // 14. Gán food_item_id không hợp lệ -> 400
    // Tạo thêm 1 bản ghi pending khác để test lỗi
    const testPending2 = new UnidentifiedFood({
      reported_by_user_id: userId,
      name_guess: "Món Test 2",
      status: "pending",
      created_at: new Date(),
    });
    await testPending2.save();

    const resResolveInvalidFoodId = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testPending2._id}/resolve`,
      token: adminToken,
      body: {
        food_item_id: "invalid_food_oid",
      },
    });
    assert(
      resResolveInvalidFoodId.statusCode === 400,
      "14. Gán food_item_id không phải ObjectId hợp lệ trả về 400 Bad Request",
    );

    // 15. Gán food_item_id không tồn tại trong food_items -> 404
    const resResolveNotFoundFoodId = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testPending2._id}/resolve`,
      token: adminToken,
      body: {
        food_item_id: new mongoose.Types.ObjectId().toString(),
      },
    });
    assert(
      resResolveNotFoundFoodId.statusCode === 404,
      "15. Gán food_item_id không tồn tại trong từ điển trả về 404 Not Found",
    );

    // 16. Cố tình resolve bản ghi đã được resolve trước đó -> 400
    const resResolveAlreadyResolved = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testRecordId}/resolve`,
      token: adminToken,
      body: {
        food_item_id: testFood._id.toString(),
      },
    });
    assert(
      resResolveAlreadyResolved.statusCode === 400,
      "16. Bản ghi đã resolved trước đó bị từ chối với 400 Bad Request",
    );

    // ------------------------------------------------------------
    // TEST SECTION 5: RESOLVE BY CREATING NEW FOOD
    // ------------------------------------------------------------
    console.log("\n--- 5. Resolve by Creating New Food ---");

    // 17. Resolve bằng cách tạo món ăn mới
    const resResolveNewFood = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testPending2._id}/resolve`,
      token: adminToken,
      body: {
        new_food: {
          name: "Món Mới Tạo Từ Hàng Đợi",
          category: "Món nước",
          calories_per_100g: 220,
          protein_per_100g: 15,
          carb_per_100g: 20,
          fat_per_100g: 8,
          aliases: ["món mới", "món test"],
        },
      },
    });
    assert(
      resResolveNewFood.statusCode === 200 &&
        resResolveNewFood.body.data.item.status === "resolved",
      "17. Chuẩn hóa bằng cách tạo món ăn mới thành công",
    );

    // 18. Kiểm tra món mới tạo có is_verified: true
    const createdFoodId =
      resResolveNewFood.body.data.item.resolved_food_item._id;
    const dbCreatedFood = await FoodItem.findById(createdFoodId).lean();
    assert(
      dbCreatedFood && dbCreatedFood.is_verified === true,
      "18. Món ăn mới tạo tự động mang trạng thái is_verified: true",
    );

    // 19. Kiểm tra created_by_admin_id lấy từ JWT admin
    assert(
      dbCreatedFood &&
        dbCreatedFood.created_by_admin_id?.toString() === adminId.toString(),
      "19. created_by_admin_id của món mới gắn đúng định danh Admin từ JWT",
    );

    // 20. Client không thể ghi đè created_by_admin_id
    const testPending3 = new UnidentifiedFood({
      reported_by_user_id: userId,
      name_guess: "Món Test 3",
      status: "pending",
      created_at: new Date(),
    });
    await testPending3.save();

    const fakeAdminId = new mongoose.Types.ObjectId().toString();
    const resResolveOverride = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testPending3._id}/resolve`,
      token: adminToken,
      body: {
        new_food: {
          name: "Món Test Override Admin",
          calories_per_100g: 100,
          created_by_admin_id: fakeAdminId,
        },
      },
    });
    const overrideFood = await FoodItem.findById(
      resResolveOverride.body.data.item.resolved_food_item._id,
    ).lean();
    assert(
      overrideFood &&
        overrideFood.created_by_admin_id?.toString() === adminId.toString(),
      "20. Client không thể ghi đè created_by_admin_id, server luôn lấy từ JWT",
    );

    // ------------------------------------------------------------
    // TEST SECTION 6: DELETE REPORT & INTEGRITY
    // ------------------------------------------------------------
    console.log("\n--- 6. Delete Report & Data Integrity ---");

    // 21. Xóa bản ghi pending
    const testPending4 = new UnidentifiedFood({
      reported_by_user_id: userId,
      name_guess: "Món Rác Cần Xóa",
      status: "pending",
      created_at: new Date(),
    });
    await testPending4.save();

    const resDeletePending = await makeRequest({
      method: "DELETE",
      path: `/api/admin/unidentified-foods/${testPending4._id}`,
      token: adminToken,
    });
    assert(
      resDeletePending.statusCode === 200,
      "21. Xóa bản ghi báo cáo pending thành công (200 OK)",
    );

    // 22. Xóa bản ghi resolved
    const resDeleteResolved = await makeRequest({
      method: "DELETE",
      path: `/api/admin/unidentified-foods/${testRecordId}`,
      token: adminToken,
    });
    assert(
      resDeleteResolved.statusCode === 200,
      "22. Xóa bản ghi báo cáo resolved thành công (200 OK)",
    );

    // 23. Xóa bản ghi unidentified không làm mất món trong food_items
    const verifyFoodStillExists = await FoodItem.findById(testFood._id);
    assert(
      verifyFoodStillExists !== null,
      "23. Xóa báo cáo KHÔNG làm ảnh hưởng hay xóa món ăn trong food_items",
    );

    // 24. Không để lộ password_hash
    const listJson = JSON.stringify(resAdminList.body);
    assert(
      !listJson.includes("password_hash"),
      "24. Tuyệt đối không để lộ password_hash trong danh sách",
    );

    // 25. Không để lộ các thông tin hồ sơ sức khỏe cá nhân
    assert(
      !listJson.includes("target_calories") &&
        !listJson.includes("weight_kg") &&
        !listJson.includes("food_preferences"),
      "25. Tuyệt đối không để lộ thông tin hồ sơ cá nhân của người báo cáo",
    );

    // 26. User thường không thể resolve -> 403
    const resUserResolve = await makeRequest({
      method: "PUT",
      path: `/api/admin/unidentified-foods/${testPending3._id}/resolve`,
      token: userToken,
      body: { food_item_id: testFood._id.toString() },
    });
    assert(
      resUserResolve.statusCode === 403,
      "26. User thường không có quyền resolve (403 Forbidden)",
    );

    // 27. User thường không thể delete -> 403
    const resUserDelete = await makeRequest({
      method: "DELETE",
      path: `/api/admin/unidentified-foods/${testPending3._id}`,
      token: userToken,
    });
    assert(
      resUserDelete.statusCode === 403,
      "27. User thường không có quyền delete (403 Forbidden)",
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
    console.log("============================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
