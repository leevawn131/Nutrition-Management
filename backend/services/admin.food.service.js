const mongoose = require("mongoose");
const FoodItem = require("../models/food_item.model");

class AdminFoodService {
  /**
   * List foods with pagination, search, category filter, and verification filter
   */
  async listFoods({
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    is_verified = "all",
  }) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error("Tham số page phải là số nguyên dương >= 1.");
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      const error = new Error(
        "Tham số limit phải là số nguyên trong khoảng từ 1 đến 100.",
      );
      error.statusCode = 400;
      throw error;
    }

    const query = {};

    // Search filter across name, name_en, aliases
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      query.$or = [
        { name: searchRegex },
        { name_en: searchRegex },
        { aliases: searchRegex },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Verification filter
    if (is_verified && is_verified !== "all") {
      if (is_verified === "true" || is_verified === true) {
        query.is_verified = true;
      } else if (is_verified === "false" || is_verified === false) {
        query.is_verified = false;
      }
    }

    const total = await FoodItem.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;

    const foods = await FoodItem.find(query)
      .sort({ created_at: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      foods,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Get single food item by ID
   */
  async getFoodById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID món ăn không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const food = await FoodItem.findById(id).lean();
    if (!food) {
      const error = new Error("Không tìm thấy món ăn với ID đã cung cấp.");
      error.statusCode = 404;
      throw error;
    }

    return food;
  }

  /**
   * Create a new food item
   */
  async createFood(foodData, adminId) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      const error = new Error("ID Admin không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    // Validate required fields
    if (
      !foodData.name ||
      typeof foodData.name !== "string" ||
      !foodData.name.trim()
    ) {
      const error = new Error("Tên món ăn là bắt buộc và không được để trống.");
      error.statusCode = 400;
      throw error;
    }

    if (
      foodData.calories_per_100g === undefined ||
      foodData.calories_per_100g === null ||
      isNaN(Number(foodData.calories_per_100g)) ||
      Number(foodData.calories_per_100g) < 0
    ) {
      const error = new Error(
        "Lượng calo/100g (calories_per_100g) phải là số không âm (>= 0).",
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate macros if provided
    const macroFields = ["protein_per_100g", "carb_per_100g", "fat_per_100g"];
    for (const field of macroFields) {
      if (
        foodData[field] !== undefined &&
        foodData[field] !== null &&
        foodData[field] !== ""
      ) {
        if (isNaN(Number(foodData[field])) || Number(foodData[field]) < 0) {
          const error = new Error(
            `Trường ${field} phải là số không âm (>= 0).`,
          );
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // Validate aliases array
    let aliases = [];
    if (foodData.aliases !== undefined && foodData.aliases !== null) {
      if (!Array.isArray(foodData.aliases)) {
        const error = new Error(
          "Trường bí danh (aliases) phải là một mảng chuỗi.",
        );
        error.statusCode = 400;
        throw error;
      }
      aliases = foodData.aliases
        .filter((a) => typeof a === "string" && a.trim())
        .map((a) => a.trim());
    }

    const newFood = new FoodItem({
      name: foodData.name.trim(),
      name_en:
        foodData.name_en && typeof foodData.name_en === "string"
          ? foodData.name_en.trim()
          : null,
      category:
        foodData.category && typeof foodData.category === "string"
          ? foodData.category.trim()
          : null,
      calories_per_100g: Number(foodData.calories_per_100g),
      protein_per_100g:
        foodData.protein_per_100g !== undefined &&
        foodData.protein_per_100g !== null &&
        foodData.protein_per_100g !== ""
          ? Number(foodData.protein_per_100g)
          : null,
      carb_per_100g:
        foodData.carb_per_100g !== undefined &&
        foodData.carb_per_100g !== null &&
        foodData.carb_per_100g !== ""
          ? Number(foodData.carb_per_100g)
          : null,
      fat_per_100g:
        foodData.fat_per_100g !== undefined &&
        foodData.fat_per_100g !== null &&
        foodData.fat_per_100g !== ""
          ? Number(foodData.fat_per_100g)
          : null,
      image_url:
        foodData.image_url && typeof foodData.image_url === "string"
          ? foodData.image_url.trim()
          : null,
      is_verified:
        foodData.is_verified !== undefined
          ? Boolean(foodData.is_verified)
          : true,
      aliases,
      created_by_admin_id: new mongoose.Types.ObjectId(adminId),
      created_at: new Date(),
    });

    const savedFood = await newFood.save();
    return savedFood.toObject();
  }

  /**
   * Update an existing food item
   */
  async updateFood(id, updateData) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID món ăn không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    if (
      updateData._id !== undefined &&
      updateData._id.toString() !== id.toString()
    ) {
      const error = new Error("Không được phép thay đổi _id của món ăn.");
      error.statusCode = 400;
      throw error;
    }

    if (updateData.created_by_admin_id !== undefined) {
      const error = new Error(
        "Không được phép thay đổi người tạo (created_by_admin_id).",
      );
      error.statusCode = 400;
      throw error;
    }

    if (updateData.created_at !== undefined) {
      const error = new Error(
        "Không được phép thay đổi thời điểm tạo (created_at).",
      );
      error.statusCode = 400;
      throw error;
    }

    const food = await FoodItem.findById(id);
    if (!food) {
      const error = new Error("Không tìm thấy món ăn với ID đã cung cấp.");
      error.statusCode = 404;
      throw error;
    }

    const updates = {};

    if (updateData.name !== undefined) {
      if (
        !updateData.name ||
        typeof updateData.name !== "string" ||
        !updateData.name.trim()
      ) {
        const error = new Error("Tên món ăn không được để trống.");
        error.statusCode = 400;
        throw error;
      }
      updates.name = updateData.name.trim();
    }

    if (updateData.name_en !== undefined) {
      updates.name_en =
        updateData.name_en && typeof updateData.name_en === "string"
          ? updateData.name_en.trim()
          : null;
    }

    if (updateData.category !== undefined) {
      updates.category =
        updateData.category && typeof updateData.category === "string"
          ? updateData.category.trim()
          : null;
    }

    if (updateData.calories_per_100g !== undefined) {
      if (
        updateData.calories_per_100g === null ||
        isNaN(Number(updateData.calories_per_100g)) ||
        Number(updateData.calories_per_100g) < 0
      ) {
        const error = new Error("Lượng calo/100g phải là số không âm (>= 0).");
        error.statusCode = 400;
        throw error;
      }
      updates.calories_per_100g = Number(updateData.calories_per_100g);
    }

    const macroFields = ["protein_per_100g", "carb_per_100g", "fat_per_100g"];
    for (const field of macroFields) {
      if (updateData[field] !== undefined) {
        if (updateData[field] === null || updateData[field] === "") {
          updates[field] = null;
        } else {
          if (
            isNaN(Number(updateData[field])) ||
            Number(updateData[field]) < 0
          ) {
            const error = new Error(
              `Trường ${field} phải là số không âm (>= 0).`,
            );
            error.statusCode = 400;
            throw error;
          }
          updates[field] = Number(updateData[field]);
        }
      }
    }

    if (updateData.image_url !== undefined) {
      updates.image_url =
        updateData.image_url && typeof updateData.image_url === "string"
          ? updateData.image_url.trim()
          : null;
    }

    if (updateData.is_verified !== undefined) {
      updates.is_verified = Boolean(updateData.is_verified);
    }

    if (updateData.aliases !== undefined) {
      if (!Array.isArray(updateData.aliases)) {
        const error = new Error(
          "Trường bí danh (aliases) phải là một mảng chuỗi.",
        );
        error.statusCode = 400;
        throw error;
      }
      updates.aliases = updateData.aliases
        .filter((a) => typeof a === "string" && a.trim())
        .map((a) => a.trim());
    }

    const updatedFood = await FoodItem.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    return updatedFood;
  }

  /**
   * Delete a food item with server-side reference check
   */
  async deleteFood(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID món ăn không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const food = await FoodItem.findById(id);
    if (!food) {
      const error = new Error("Không tìm thấy món ăn với ID đã cung cấp.");
      error.statusCode = 404;
      throw error;
    }

    const foodObjId = new mongoose.Types.ObjectId(id);

    // Reference Check across meal_logs, meal_plans, and unidentified_foods
    const [mealLogsCount, mealPlansCount, unidentifiedFoodsCount] =
      await Promise.all([
        mongoose.connection
          .collection("meal_logs")
          .countDocuments({ food_item_id: foodObjId }),
        mongoose.connection
          .collection("meal_plans")
          .countDocuments({ food_item_id: foodObjId }),
        mongoose.connection
          .collection("unidentified_foods")
          .countDocuments({ resolved_food_item_id: foodObjId }),
      ]);

    if (mealLogsCount > 0 || mealPlansCount > 0 || unidentifiedFoodsCount > 0) {
      const reasons = [];
      if (mealLogsCount > 0)
        reasons.push(`${mealLogsCount} nhật ký ăn uống (meal_logs)`);
      if (mealPlansCount > 0)
        reasons.push(`${mealPlansCount} kế hoạch bữa ăn (meal_plans)`);
      if (unidentifiedFoodsCount > 0)
        reasons.push(`${unidentifiedFoodsCount} nhận diện món chưa phân loại`);

      const error = new Error(
        `Không thể xóa món ăn này vì đang được liên kết với: ${reasons.join(", ")}. Vui lòng giữ lại để bảo toàn dữ liệu người dùng.`,
      );
      error.statusCode = 400;
      throw error;
    }

    await FoodItem.findByIdAndDelete(id);

    return {
      success: true,
      message: `Đã xóa món ăn "${food.name}" thành công.`,
    };
  }
}

module.exports = new AdminFoodService();
