const mongoose = require("mongoose");
const UnidentifiedFood = require("../models/unidentified_food.model");
const FoodItem = require("../models/food_item.model");

class AdminUnidentifiedFoodService {
  /**
   * 1. LIST UNIDENTIFIED FOODS (Phân trang, lọc theo status, tìm kiếm theo name_guess)
   */
  async listUnidentifiedFoods({
    status = "all",
    search = "",
    page = 1,
    limit = 10,
  } = {}) {
    const validStatuses = ["pending", "resolved", "all"];
    if (!validStatuses.includes(status)) {
      const error = new Error(
        "Tham số status không hợp lệ. Chỉ chấp nhận: pending, resolved, hoặc all.",
      );
      error.statusCode = 400;
      throw error;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Xây dựng điều kiện truy vấn
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      query.name_guess = { $regex: search.trim(), $options: "i" };
    }

    // Thực hiện truy vấn song song (danh sách + tổng số + tóm tắt summary)
    const [items, totalFiltered, totalAll, totalPending, totalResolved] =
      await Promise.all([
        UnidentifiedFood.find(query)
          .populate("reported_by_user_id", "_id full_name email")
          .populate(
            "resolved_food_item_id",
            "_id name name_en category calories_per_100g protein_per_100g carb_per_100g fat_per_100g image_url is_verified",
          )
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        UnidentifiedFood.countDocuments(query),
        UnidentifiedFood.countDocuments(),
        UnidentifiedFood.countDocuments({ status: "pending" }),
        UnidentifiedFood.countDocuments({ status: "resolved" }),
      ]);

    const formattedItems = items.map((item) => ({
      _id: item._id,
      image_url: item.image_url,
      name_guess: item.name_guess,
      status: item.status,
      reported_by: item.reported_by_user_id
        ? {
            _id: item.reported_by_user_id._id,
            full_name: item.reported_by_user_id.full_name || null,
            email: item.reported_by_user_id.email,
          }
        : null,
      resolved_food_item: item.resolved_food_item_id || null,
      created_at: item.created_at,
    }));

    return {
      items: formattedItems,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalFiltered / limitNum) || 1,
      },
      summary: {
        total: totalAll,
        pending: totalPending,
        resolved: totalResolved,
      },
    };
  }

  /**
   * 2. GET UNIDENTIFIED FOOD BY ID
   */
  async getUnidentifiedFoodById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID bản ghi món ăn chưa xác định không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const item = await UnidentifiedFood.findById(id)
      .populate("reported_by_user_id", "_id full_name email")
      .populate(
        "resolved_food_item_id",
        "_id name name_en category calories_per_100g protein_per_100g carb_per_100g fat_per_100g image_url is_verified",
      )
      .lean();

    if (!item) {
      const error = new Error("Không tìm thấy bản ghi món ăn chưa xác định");
      error.statusCode = 404;
      throw error;
    }

    return {
      _id: item._id,
      image_url: item.image_url,
      name_guess: item.name_guess,
      status: item.status,
      reported_by: item.reported_by_user_id
        ? {
            _id: item.reported_by_user_id._id,
            full_name: item.reported_by_user_id.full_name || null,
            email: item.reported_by_user_id.email,
          }
        : null,
      resolved_food_item: item.resolved_food_item_id || null,
      created_at: item.created_at,
    };
  }

  /**
   * 3. RESOLVE UNIDENTIFIED FOOD (Gán món có sẵn hoặc Tạo món mới)
   */
  async resolveUnidentifiedFood(id, { food_item_id, new_food } = {}, adminId) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID bản ghi món ăn chưa xác định không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const record = await UnidentifiedFood.findById(id);
    if (!record) {
      const error = new Error("Không tìm thấy bản ghi món ăn chưa xác định");
      error.statusCode = 404;
      throw error;
    }

    if (record.status === "resolved") {
      const error = new Error(
        "Bản ghi báo cáo món ăn này đã được chuẩn hóa trước đó",
      );
      error.statusCode = 400;
      throw error;
    }

    let targetFoodId = null;

    // HÌNH THỨC 1: Gán món có sẵn trong food_items
    if (food_item_id) {
      if (!mongoose.Types.ObjectId.isValid(food_item_id)) {
        const error = new Error("ID món ăn được chọn không hợp lệ");
        error.statusCode = 400;
        throw error;
      }

      const existingFood = await FoodItem.findById(food_item_id);
      if (!existingFood) {
        const error = new Error(
          "Không tìm thấy món ăn trong cơ sở dữ liệu để gán liên kết",
        );
        error.statusCode = 404;
        throw error;
      }

      targetFoodId = existingFood._id;
    }
    // HÌNH THỨC 2: Tạo món ăn mới vào food_items
    else if (new_food && typeof new_food === "object") {
      const {
        name,
        name_en,
        category,
        calories_per_100g,
        protein_per_100g,
        carb_per_100g,
        fat_per_100g,
        image_url,
        aliases,
      } = new_food;

      if (!name || typeof name !== "string" || !name.trim()) {
        const error = new Error("Tên món ăn mới là bắt buộc");
        error.statusCode = 400;
        throw error;
      }

      if (
        calories_per_100g === undefined ||
        calories_per_100g === null ||
        isNaN(calories_per_100g) ||
        Number(calories_per_100g) < 0
      ) {
        const error = new Error("Lượng calo trên 100g phải là số không âm");
        error.statusCode = 400;
        throw error;
      }

      if (
        protein_per_100g !== undefined &&
        protein_per_100g !== null &&
        (isNaN(protein_per_100g) || Number(protein_per_100g) < 0)
      ) {
        const error = new Error("Hàm lượng đạm không được là số âm");
        error.statusCode = 400;
        throw error;
      }

      if (
        carb_per_100g !== undefined &&
        carb_per_100g !== null &&
        (isNaN(carb_per_100g) || Number(carb_per_100g) < 0)
      ) {
        const error = new Error("Hàm lượng đường bột không được là số âm");
        error.statusCode = 400;
        throw error;
      }

      if (
        fat_per_100g !== undefined &&
        fat_per_100g !== null &&
        (isNaN(fat_per_100g) || Number(fat_per_100g) < 0)
      ) {
        const error = new Error("Hàm lượng chất béo không được là số âm");
        error.statusCode = 400;
        throw error;
      }

      if (
        aliases !== undefined &&
        aliases !== null &&
        !Array.isArray(aliases)
      ) {
        const error = new Error(
          "Bí danh món ăn (aliases) phải là một mảng chuỗi",
        );
        error.statusCode = 400;
        throw error;
      }

      const createdFood = new FoodItem({
        name: name.trim(),
        name_en: name_en ? name_en.trim() : null,
        category: category ? category.trim() : null,
        calories_per_100g: Number(calories_per_100g),
        protein_per_100g:
          protein_per_100g !== undefined && protein_per_100g !== null
            ? Number(protein_per_100g)
            : null,
        carb_per_100g:
          carb_per_100g !== undefined && carb_per_100g !== null
            ? Number(carb_per_100g)
            : null,
        fat_per_100g:
          fat_per_100g !== undefined && fat_per_100g !== null
            ? Number(fat_per_100g)
            : null,
        image_url: image_url || record.image_url || null,
        aliases: Array.isArray(aliases)
          ? aliases
              .filter((a) => typeof a === "string" && a.trim())
              .map((a) => a.trim())
          : [],
        is_verified: true,
        created_by_admin_id: adminId
          ? new mongoose.Types.ObjectId(adminId)
          : null,
        created_at: new Date(),
      });

      const savedFood = await createdFood.save();
      targetFoodId = savedFood._id;
    } else {
      const error = new Error(
        "Vui lòng cung cấp food_item_id để gán món có sẵn hoặc new_food để tạo món mới",
      );
      error.statusCode = 400;
      throw error;
    }

    // Cập nhật trạng thái bản ghi báo cáo
    record.status = "resolved";
    record.resolved_food_item_id = targetFoodId;
    await record.save();

    return this.getUnidentifiedFoodById(record._id);
  }

  /**
   * 4. DELETE UNIDENTIFIED FOOD REPORT
   */
  async deleteUnidentifiedFood(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID bản ghi món ăn chưa xác định không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const record = await UnidentifiedFood.findById(id);
    if (!record) {
      const error = new Error(
        "Không tìm thấy bản ghi món ăn chưa xác định để xóa",
      );
      error.statusCode = 404;
      throw error;
    }

    // Chỉ xóa bản ghi unidentified_foods, không xóa món ăn hay người dùng liên quan
    await UnidentifiedFood.findByIdAndDelete(id);

    return {
      success: true,
      message: "Xóa bản ghi báo cáo món ăn chưa xác định thành công.",
    };
  }
}

module.exports = new AdminUnidentifiedFoodService();
