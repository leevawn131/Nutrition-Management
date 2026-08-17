// ============================================================
// MONGODB SETUP SCRIPT — Ứng dụng Quản lý Dinh dưỡng & Vận động
// Đồng bộ 100% theo tài liệu: thietkedatabase.docx (9 Module / 27 Bảng)
// 
// Cách chạy:
//   mongosh "mongodb://localhost:27017/nutrition_app" database/mongodb-setup.js
// hoặc mở mongosh rồi copy-paste script này vào chạy
// ============================================================

use("nutrition_app");

// ------------------------------------------------------------
// MODULE A: NGƯỜI DÙNG & HỒ SƠ (users, user_food_preferences, streaks)
// ------------------------------------------------------------

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password_hash", "role", "created_at"],
      properties: {
        email: { bsonType: "string", description: "Email đăng nhập (UNIQUE, NOT NULL)" },
        password_hash: { bsonType: "string", description: "Mật khẩu đã mã hoá (NOT NULL)" },
        full_name: { bsonType: ["string", "null"], description: "Họ tên hiển thị" },
        avatar_url: { bsonType: ["string", "null"], description: "Ảnh đại diện" },
        gender: { enum: ["male", "female", "other", null], description: "Giới tính" },
        date_of_birth: { bsonType: ["date", "null"], description: "Ngày sinh" },
        height_cm: { bsonType: ["double", "int", "decimal", "null"], description: "Chiều cao (cm)" },
        weight_kg: { bsonType: ["double", "int", "decimal", "null"], description: "Cân nặng (kg)" },
        activity_level: {
          enum: ["sedentary", "light", "moderate", "active", "very_active", null],
          description: "Mức độ vận động tính TDEE"
        },
        goal: { enum: ["lose", "maintain", "gain", null], description: "Mục tiêu cá nhân" },
        target_calories: { bsonType: ["int", "null"], description: "Calo mục tiêu/ngày" },
        target_protein_g: { bsonType: ["double", "int", "decimal", "null"], description: "Mục tiêu đạm/ngày (g)" },
        target_carb_g: { bsonType: ["double", "int", "decimal", "null"], description: "Mục tiêu đường bột/ngày (g)" },
        target_fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Mục tiêu chất béo/ngày (g)" },
        role: { enum: ["user", "admin"], description: "Phân quyền (DEFAULT: user)" },
        // Nhúng bảng user_food_preferences vào document users (quan hệ 1-N nhỏ)
        food_preferences: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["preference_type", "value"],
            properties: {
              preference_type: { enum: ["diet_type", "allergy", "favorite", "dislike"] },
              value: { bsonType: "string" },
            },
          },
        },
        // Nhúng bảng streaks vào document users (quan hệ 1-1)
        streak: {
          bsonType: ["object", "null"],
          properties: {
            current_streak: { bsonType: "int" },
            longest_streak: { bsonType: "int" },
            last_success_date: { bsonType: ["date", "null"] },
          },
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: ["date", "null"] },
      },
    },
  },
});
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// ------------------------------------------------------------
// MODULE B: DANH MỤC MÓN ĂN & NHẬT KÝ ĂN UỐNG
// ------------------------------------------------------------

db.createCollection("food_items", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "calories_per_100g", "is_verified", "created_at"],
      properties: {
        name: { bsonType: "string", description: "Tên món tiếng Việt (NOT NULL)" },
        name_en: { bsonType: ["string", "null"], description: "Tên tiếng Anh (tuỳ chọn)" },
        category: { bsonType: ["string", "null"], description: "Loại món: cơm, món nước, tráng miệng..." },
        calories_per_100g: { bsonType: ["double", "int", "decimal"], description: "Calo/100g (NOT NULL)" },
        protein_per_100g: { bsonType: ["double", "int", "decimal", "null"], description: "Đạm/100g" },
        carb_per_100g: { bsonType: ["double", "int", "decimal", "null"], description: "Đường bột/100g" },
        fat_per_100g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo/100g" },
        image_url: { bsonType: ["string", "null"], description: "Ảnh minh hoạ" },
        is_verified: { bsonType: "bool", description: "Đã được Admin xác thực (DEFAULT: true)" },
        // Nhúng bảng food_aliases (aliases[]) vào food_items
        aliases: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Các tên gọi khác của món ăn (hỗ trợ AI NLP khớp mô tả)"
        },
        created_by_admin_id: { bsonType: ["objectId", "null"] },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.food_items.createIndex({ name: "text", aliases: "text" }); // Tìm kiếm Text Search
db.food_items.createIndex({ category: 1 });

db.createCollection("meal_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "input_method", "calories", "meal_type", "logged_at", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        food_item_id: { bsonType: ["objectId", "null"], description: "FK -> food_items.id (NULL nếu món chưa xác định)" },
        input_method: { enum: ["photo", "gallery", "text"], description: "Phương thức nhập liệu (NOT NULL)" },
        source_image_url: { bsonType: ["string", "null"], description: "Ảnh gốc nếu input_method là photo/gallery" },
        description_text: { bsonType: ["string", "null"], description: "Mô tả gốc nếu input_method là text" },
        portion_label: { enum: ["small", "medium", "large", null], description: "Khẩu phần chọn thủ công" },
        portion_grams: { bsonType: ["double", "int", "decimal", "null"], description: "Khối lượng quy đổi (g)" },
        calories: { bsonType: ["double", "int", "decimal"], description: "Calo tính được cho lượt ăn này (NOT NULL)" },
        protein_g: { bsonType: ["double", "int", "decimal", "null"], description: "Đạm (g)" },
        carb_g: { bsonType: ["double", "int", "decimal", "null"], description: "Đường bột (g)" },
        fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo (g)" },
        meal_type: { enum: ["breakfast", "lunch", "dinner", "snack"], description: "Bữa ăn (NOT NULL)" },
        logged_at: { bsonType: "date", description: "Thời điểm ăn (dùng gom theo ngày, NOT NULL)" },
        created_at: { bsonType: "date", description: "Thời điểm tạo bản ghi (quyền sửa/xoá trong 24h, NOT NULL)" },
        // Nhúng tóm tắt kết quả recognition nếu log từ AI
        recognition_summary: {
          bsonType: ["object", "null"],
          properties: {
            recognition_id: { bsonType: ["objectId", "null"] },
            predicted_label: { bsonType: ["string", "null"] },
            confidence: { bsonType: ["double", "int", "decimal", "null"] },
            corrected_label: { bsonType: ["string", "null"] },
          }
        }
      },
    },
  },
});
db.meal_logs.createIndex({ user_id: 1, logged_at: -1 });
db.meal_logs.createIndex({ food_item_id: 1 });

db.createCollection("recognition_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "source_type", "raw_input", "ai_model", "raw_response", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        meal_log_id: { bsonType: ["objectId", "null"], description: "FK -> meal_logs.id (NULL nếu user chưa lưu)" },
        source_type: { enum: ["image", "text"], description: "Loại đầu vào (NOT NULL)" },
        raw_input: { bsonType: "string", description: "Đường dẫn ảnh hoặc nội dung mô tả gốc (NOT NULL)" },
        predicted_label: { bsonType: ["string", "null"], description: "Kết quả AI trả về" },
        confidence: { bsonType: ["double", "int", "decimal", "null"], description: "% độ tin cậy" },
        corrected_label: { bsonType: ["string", "null"], description: "Tên món user tự sửa nếu có" },
        ai_model: { bsonType: "string", description: "Tên model AI đang gọi (NOT NULL)" },
        raw_response: { bsonType: ["string", "object"], description: "Nguyên văn JSON Gemini trả về (NOT NULL)" },
        created_at: { bsonType: "date", description: "Thời điểm gọi AI (NOT NULL)" },
      },
    },
  },
});
db.recognition_history.createIndex({ user_id: 1, created_at: -1 });
db.recognition_history.createIndex({ meal_log_id: 1 });

db.createCollection("unidentified_foods", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reported_by_user_id", "status", "created_at"],
      properties: {
        reported_by_user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        image_url: { bsonType: ["string", "null"] },
        name_guess: { bsonType: ["string", "null"], description: "Tên user tự nhập tạm" },
        status: { enum: ["pending", "resolved"], description: "Trạng thái xử lý (DEFAULT: pending)" },
        resolved_food_item_id: { bsonType: ["objectId", "null"], description: "FK -> food_items.id khi Admin xử lý" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.unidentified_foods.createIndex({ status: 1 });
db.unidentified_foods.createIndex({ reported_by_user_id: 1 });

// ------------------------------------------------------------
// MODULE C: HOẠT ĐỘNG THỂ CHẤT
// ------------------------------------------------------------

db.createCollection("activities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "met_value", "created_at"],
      properties: {
        name: { bsonType: "string", description: "Tên hoạt động (NOT NULL)" },
        met_value: { bsonType: ["double", "int", "decimal"], description: "Chỉ số MET (NOT NULL)" },
        category: { bsonType: ["string", "null"], description: "Nhóm hoạt động" },
        created_by_admin_id: { bsonType: ["objectId", "null"], description: "FK -> users.id" },
        created_at: { bsonType: "date" },
      },
    },
  },
});

db.createCollection("activity_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "duration_minutes", "calories_burned", "logged_at", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        activity_id: { bsonType: ["objectId", "null"], description: "FK -> activities.id (NULL nếu tự nhập)" },
        custom_activity_name: { bsonType: ["string", "null"], description: "Tên hoạt động tự nhập" },
        duration_minutes: { bsonType: ["int", "double", "decimal"], description: "Thời lượng (phút) (NOT NULL)" },
        calories_burned: { bsonType: ["double", "int", "decimal"], description: "Calo tiêu thụ = MET × kg × thời gian (NOT NULL)" },
        logged_at: { bsonType: "date", description: "Thời điểm thực hiện (NOT NULL)" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.activity_logs.createIndex({ user_id: 1, logged_at: -1 });

// ------------------------------------------------------------
// MODULE D: TRỢ LÝ AI CHATBOT
// ------------------------------------------------------------

db.createCollection("chat_conversations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        title: { bsonType: ["string", "null"], description: "Tiêu đề phiên theo câu hỏi đầu tiên" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.chat_conversations.createIndex({ user_id: 1, created_at: -1 });

db.createCollection("chat_messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversation_id", "sender", "content", "created_at"],
      properties: {
        conversation_id: { bsonType: "objectId", description: "FK -> chat_conversations.id (NOT NULL)" },
        sender: { enum: ["user", "ai"], description: "Người gửi (NOT NULL)" },
        content: { bsonType: "string", description: "Nội dung tin nhắn (NOT NULL)" },
        suggested_action_type: {
          enum: ["add_to_meal_plan", "set_goal", "add_to_activity_plan", null],
          description: "Hành động nhanh AI gợi ý"
        },
        suggested_action_payload: { bsonType: ["object", "null"], description: "Dữ liệu payload thực thi hành động" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.chat_messages.createIndex({ conversation_id: 1, created_at: 1 });

// ------------------------------------------------------------
// MODULE E: CÔNG THỨC & KẾ HOẠCH BỮA ĂN
// ------------------------------------------------------------

db.createCollection("recipes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "servings", "source_type", "status", "created_at"],
      properties: {
        title: { bsonType: "string", description: "Tên công thức (NOT NULL)" },
        description: { bsonType: ["string", "null"] },
        image_url: { bsonType: ["string", "null"] },
        prep_time_minutes: { bsonType: ["int", "null"], description: "Thời gian chuẩn bị" },
        cook_time_minutes: { bsonType: ["int", "null"], description: "Thời gian nấu" },
        servings: { bsonType: ["int", "double", "decimal"], description: "Khẩu phần (NOT NULL)" },
        calories_per_serving: { bsonType: ["double", "int", "decimal", "null"], description: "Calo tóm tắt/khẩu phần" },
        protein_g: { bsonType: ["double", "int", "decimal", "null"], description: "Đạm tóm tắt (g)" },
        carb_g: { bsonType: ["double", "int", "decimal", "null"], description: "Đường bột tóm tắt (g)" },
        fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo tóm tắt (g)" },
        avg_rating: { bsonType: ["double", "int", "decimal", "null"], description: "Đánh giá TB (DEFAULT: 0)" },
        comment_count: { bsonType: ["int", "null"], description: "Số bình luận (DEFAULT: 0)" },
        source_type: { enum: ["system", "community"], description: "Nguồn công thức (NOT NULL)" },
        created_by_user_id: { bsonType: ["objectId", "null"], description: "FK -> users.id (NULL nếu system)" },
        status: { enum: ["pending", "approved", "rejected"], description: "Trạng thái duyệt (DEFAULT: approved cho system)" },
        created_at: { bsonType: "date" },

        // Nhúng bảng recipe_ingredients
        ingredients: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["ingredient_name"],
            properties: {
              ingredient_name: { bsonType: "string", description: "Tên nguyên liệu (NOT NULL)" },
              quantity: { bsonType: ["double", "int", "decimal", "null"], description: "Định lượng" },
              unit: { bsonType: ["string", "null"], description: "Đơn vị: g, ml, quả, muỗng canh..." },
            },
          },
        },

        // Nhúng bảng recipe_steps
        steps: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["step_number", "instruction"],
            properties: {
              step_number: { bsonType: "int", description: "Thứ tự bước (NOT NULL)" },
              instruction: { bsonType: "string", description: "Hướng dẫn thực hiện (NOT NULL)" },
            },
          },
        },

        // Nhúng bảng recipe_nutrition_facts (đầy đủ 25 chỉ số dinh dưỡng theo docx)
        nutrition_facts: {
          bsonType: ["object", "null"],
          properties: {
            energy_kcal: { bsonType: ["double", "int", "decimal", "null"], description: "Năng lượng (kcal)" },
            protein_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất đạm (g)" },
            carbohydrate_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất bột đường (g)" },
            fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo tổng (g)" },
            fiber_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất xơ (g)" },
            saturated_fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo bão hoà (g)" },
            trans_fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo chuyển hoá (g)" },
            unsaturated_fat_g: { bsonType: ["double", "int", "decimal", "null"], description: "Chất béo không bão hoà (g)" },
            cholesterol_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Cholesterol (mg)" },
            salt_g: { bsonType: ["double", "int", "decimal", "null"], description: "Muối (g)" },
            sodium_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Natri (mg)" },
            glycemic_load: { bsonType: ["double", "int", "decimal", "null"], description: "Chỉ số tải đường huyết (GL)" },
            vitamin_a_mcg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin A (mcg)" },
            vitamin_d_mcg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin D (mcg)" },
            vitamin_e_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin E (mg)" },
            vitamin_k_mcg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin K (mcg)" },
            vitamin_c_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin C (mg)" },
            vitamin_b12_mcg: { bsonType: ["double", "int", "decimal", "null"], description: "Vitamin B12 (mcg)" },
            folic_acid_mcg: { bsonType: ["double", "int", "decimal", "null"], description: "Acid folic B9 (mcg)" },
            calcium_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Canxi (mg)" },
            iron_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Sắt (mg)" },
            zinc_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Kẽm (mg)" },
            magnesium_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Magie (mg)" },
            potassium_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Kali (mg)" },
            phosphorus_mg: { bsonType: ["double", "int", "decimal", "null"], description: "Phospho (mg)" },
            updated_at: { bsonType: ["date", "null"] },
          },
        },
      },
    },
  },
});
db.recipes.createIndex({ title: "text" });
db.recipes.createIndex({ source_type: 1, status: 1 });
db.recipes.createIndex({ created_by_user_id: 1 });

db.createCollection("recipe_comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["recipe_id", "user_id", "content", "status", "created_at"],
      properties: {
        recipe_id: { bsonType: "objectId", description: "FK -> recipes.id (NOT NULL)" },
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        parent_comment_id: { bsonType: ["objectId", "null"], description: "Tự tham chiếu trả lời bình luận (NULL nếu gốc)" },
        content: { bsonType: "string", description: "Nội dung bình luận (NOT NULL)" },
        rating: { bsonType: ["int", "null"], minimum: 1, maximum: 5, description: "Đánh giá 1-5 sao" },
        status: { enum: ["visible", "hidden"], description: "Trạng thái kiểm duyệt (DEFAULT: visible)" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: ["date", "null"] },
      },
    },
  },
});
db.recipe_comments.createIndex({ recipe_id: 1, created_at: -1 });
db.recipe_comments.createIndex({ parent_comment_id: 1 });

db.createCollection("meal_plan_templates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "created_by_admin_id"],
      properties: {
        name: { bsonType: "string", description: "Tên thực đơn mẫu (NOT NULL)" },
        description: { bsonType: ["string", "null"] },
        created_by_admin_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        // Nhúng meal_plan_template_items
        items: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["meal_type", "recipe_id"],
            properties: {
              meal_type: { enum: ["breakfast", "lunch", "dinner", "snack"] },
              recipe_id: { bsonType: "objectId" },
            },
          },
        },
      },
    },
  },
});

db.createCollection("meal_plans", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "plan_date", "meal_type", "source", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        plan_date: { bsonType: "date", description: "Ngày kế hoạch (NOT NULL)" },
        meal_type: { enum: ["breakfast", "lunch", "dinner", "snack"], description: "Bữa ăn (NOT NULL)" },
        recipe_id: { bsonType: ["objectId", "null"], description: "FK -> recipes.id nếu theo công thức" },
        food_item_id: { bsonType: ["objectId", "null"], description: "FK -> food_items.id nếu món đơn giản" },
        source: { enum: ["template", "recipe", "ingredient", "manual"], description: "Cách tạo kế hoạch (NOT NULL)" },
        is_logged: { bsonType: "bool", description: "Đã log vào meal_logs chưa (DEFAULT: false)" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.meal_plans.createIndex({ user_id: 1, plan_date: 1 });

// ------------------------------------------------------------
// MODULE F: KẾ HOẠCH HOẠT ĐỘNG & GIỎ HÀNG ĐI CHỢ
// ------------------------------------------------------------

db.createCollection("activity_plans", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "activity_name", "plan_date", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        activity_name: { bsonType: "string", description: "Tên hoạt động (NOT NULL)" },
        plan_date: { bsonType: "date", description: "Ngày thực hiện (NOT NULL)" },
        start_time: { bsonType: ["string", "null"], description: "Giờ bắt đầu" },
        duration_minutes: { bsonType: ["int", "double", "decimal", "null"], description: "Thời lượng (phút)" },
        note: { bsonType: ["string", "null"], description: "Ghi chú" },
        is_completed: { bsonType: "bool", description: "Đã hoàn thành (DEFAULT: false)" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.activity_plans.createIndex({ user_id: 1, plan_date: 1 });

db.createCollection("grocery_items", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "ingredient_name", "is_purchased", "source", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        ingredient_name: { bsonType: "string", description: "Tên nguyên liệu cần mua (NOT NULL)" },
        quantity: { bsonType: ["double", "int", "decimal", "null"], description: "Số lượng" },
        unit: { bsonType: ["string", "null"], description: "Đơn vị (g, ml, quả...)" },
        is_purchased: { bsonType: "bool", description: "Đã mua (DEFAULT: false)" },
        source: { enum: ["manual", "meal_plan"], description: "Nguồn thêm (NOT NULL)" },
        meal_plan_id: { bsonType: ["objectId", "null"], description: "FK -> meal_plans.id nếu gom từ kế hoạch" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.grocery_items.createIndex({ user_id: 1, is_purchased: 1 });

// ------------------------------------------------------------
// MODULE G: THÔNG BÁO & STREAK
// (Streak đã được nhúng tối ưu trong users)
// ------------------------------------------------------------

db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "type", "title", "message", "is_read", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        type: {
          enum: ["meal_logged", "activity_reminder", "meal_reminder", "streak", "exceed_calories"],
          description: "Loại thông báo (NOT NULL)"
        },
        title: { bsonType: "string", description: "Tiêu đề thông báo (NOT NULL)" },
        message: { bsonType: "string", description: "Nội dung chi tiết (NOT NULL)" },
        reference_type: { bsonType: ["string", "null"], description: "Loại thực thể điều hướng (meal_plan, activity_plan...)" },
        reference_id: { bsonType: ["objectId", "string", "null"], description: "ID điều hướng" },
        is_read: { bsonType: "bool", description: "Đã đọc (DEFAULT: false)" },
        created_at: { bsonType: "date", description: "Thời điểm tạo (NOT NULL)" },
      },
    },
  },
});
db.notifications.createIndex({ user_id: 1, is_read: 1, created_at: -1 });

// ------------------------------------------------------------
// MODULE H: CỘNG ĐỒNG (BÀI VIẾT / BỘ SƯU TẬP)
// ------------------------------------------------------------

db.createCollection("posts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "status", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        content: { bsonType: ["string", "null"], description: "Tiêu đề/mô tả bài viết" },
        recipe_id: { bsonType: ["objectId", "null"], description: "FK -> recipes.id nếu đính kèm công thức" },
        status: { enum: ["visible", "hidden", "pending"], description: "Trạng thái duyệt (DEFAULT: pending)" },
        // Nhúng bảng post_images (images[])
        images: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["image_url"],
            properties: {
              image_url: { bsonType: "string", description: "URL ảnh (NOT NULL)" },
              display_order: { bsonType: ["int", "null"], description: "Thứ tự hiển thị" },
            },
          },
        },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.posts.createIndex({ user_id: 1, created_at: -1 });
db.posts.createIndex({ status: 1 });

db.createCollection("user_collections", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "name", "created_at"],
      properties: {
        user_id: { bsonType: "objectId", description: "FK -> users.id (NOT NULL)" },
        name: { bsonType: "string", description: "Tên bộ sưu tập (NOT NULL)" },
        // Nhúng bảng collection_items (quan hệ đa hình post/recipe)
        items: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["item_type", "item_id", "added_at"],
            properties: {
              item_type: { enum: ["post", "recipe"], description: "Loại mục (NOT NULL)" },
              item_id: { bsonType: "objectId", description: "Trỏ tới posts.id hoặc recipes.id (NOT NULL)" },
              added_at: { bsonType: "date", description: "Thời điểm thêm (NOT NULL)" },
            },
          },
        },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.user_collections.createIndex({ user_id: 1 });

// ------------------------------------------------------------
// MODULE I: QUẢN TRỊ & KIỂM DUYỆT
// ------------------------------------------------------------

db.createCollection("moderation_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["admin_id", "target_type", "target_id", "action", "created_at"],
      properties: {
        admin_id: { bsonType: "objectId", description: "FK -> users.id của Admin (NOT NULL)" },
        target_type: { enum: ["post", "recipe"], description: "Loại đối tượng (NOT NULL)" },
        target_id: { bsonType: "objectId", description: "ID bài viết/công thức (NOT NULL)" },
        action: { enum: ["approve", "reject", "hide", "delete"], description: "Hành động kiểm duyệt (NOT NULL)" },
        reason: { bsonType: ["string", "null"], description: "Lý do kiểm duyệt" },
        created_at: { bsonType: "date" },
      },
    },
  },
});
db.moderation_logs.createIndex({ target_type: 1, target_id: 1 });
db.moderation_logs.createIndex({ admin_id: 1, created_at: -1 });

// ============================================================
print("============================================================");
print("✅ Đã tạo thành công toàn bộ Collections & Indexes cho NutritionDB!");
print("============================================================");
print("Danh sách Collections đã tạo:");
printjson(db.getCollectionNames());