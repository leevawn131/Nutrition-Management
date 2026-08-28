const mongoose = require("mongoose");
const MealPlanTemplate = require("../models/meal_plan_template.model");
const Recipe = require("../models/recipe.model");

class AdminMealPlanTemplateService {
  /**
   * Lấy danh sách thực đơn mẫu phân trang và tìm kiếm theo tên
   */
  async listTemplates({ page = 1, limit = 10, search = "" }) {
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

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      query.name = searchRegex;
    }

    const total = await MealPlanTemplate.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;

    const templates = await MealPlanTemplate.find(query)
      .populate("created_by_admin_id", "full_name email role")
      .populate(
        "items.recipe_id",
        "title image_url calories_per_serving protein_g carb_g fat_g",
      )
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Định dạng tóm tắt kèm tổng số món (item_count)
    const formattedTemplates = templates.map((t) => ({
      ...t,
      item_count: Array.isArray(t.items) ? t.items.length : 0,
    }));

    return {
      templates: formattedTemplates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Lấy chi tiết thực đơn mẫu theo ID kèm populate thông tin món ăn đầy đủ
   */
  async getTemplateById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID thực đơn mẫu không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const template = await MealPlanTemplate.findById(id)
      .populate("created_by_admin_id", "full_name email role")
      .populate(
        "items.recipe_id",
        "title description image_url prep_time_minutes cook_time_minutes servings calories_per_serving protein_g carb_g fat_g avg_rating source_type status",
      )
      .lean();

    if (!template) {
      const error = new Error(
        "Không tìm thấy thực đơn mẫu với ID đã cung cấp.",
      );
      error.statusCode = 404;
      throw error;
    }

    return {
      ...template,
      item_count: Array.isArray(template.items) ? template.items.length : 0,
    };
  }

  /**
   * Tạo thực đơn mẫu mới
   */
  async createTemplate(templateData, adminId) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      const error = new Error("ID Admin không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    // Validate tên thực đơn
    if (
      !templateData.name ||
      typeof templateData.name !== "string" ||
      !templateData.name.trim()
    ) {
      const error = new Error(
        "Tên thực đơn mẫu (name) là bắt buộc và không được để trống.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate danh sách items
    const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
    let formattedItems = [];

    if (templateData.items !== undefined && templateData.items !== null) {
      if (!Array.isArray(templateData.items)) {
        const error = new Error("Danh sách món ăn (items) phải là một mảng.");
        error.statusCode = 400;
        throw error;
      }

      for (let i = 0; i < templateData.items.length; i++) {
        const item = templateData.items[i];
        if (!item || typeof item !== "object") {
          const error = new Error(
            `Món ăn thứ ${i + 1} trong thực đơn không hợp lệ.`,
          );
          error.statusCode = 400;
          throw error;
        }

        if (!item.meal_type || !validMealTypes.includes(item.meal_type)) {
          const error = new Error(
            `Bữa ăn thứ ${i + 1} có meal_type không hợp lệ. Chỉ chấp nhận: breakfast, lunch, dinner hoặc snack.`,
          );
          error.statusCode = 400;
          throw error;
        }

        if (
          !item.recipe_id ||
          !mongoose.Types.ObjectId.isValid(item.recipe_id)
        ) {
          const error = new Error(
            `Món ăn thứ ${i + 1} có recipe_id không hợp lệ.`,
          );
          error.statusCode = 400;
          throw error;
        }

        // Kiểm tra xem công thức có tồn tại trong database không
        const recipeExists = await Recipe.findById(item.recipe_id).lean();
        if (!recipeExists) {
          const error = new Error(
            `Công thức với ID ${item.recipe_id} không tồn tại trong hệ thống.`,
          );
          error.statusCode = 400;
          throw error;
        }

        formattedItems.push({
          meal_type: item.meal_type,
          recipe_id: new mongoose.Types.ObjectId(item.recipe_id),
        });
      }
    }

    // Tạo template mới - TUÂN THỦ NGHIÊM NGẶT SCHEMA (Không thêm created_at/updated_at/is_active)
    const newTemplate = new MealPlanTemplate({
      name: templateData.name.trim(),
      description:
        templateData.description && typeof templateData.description === "string"
          ? templateData.description.trim()
          : null,
      created_by_admin_id: new mongoose.Types.ObjectId(adminId),
      items: formattedItems,
    });

    const savedTemplate = await newTemplate.save();

    const populatedTemplate = await MealPlanTemplate.findById(savedTemplate._id)
      .populate("created_by_admin_id", "full_name email role")
      .populate(
        "items.recipe_id",
        "title image_url calories_per_serving protein_g carb_g fat_g",
      )
      .lean();

    return populatedTemplate;
  }

  /**
   * Cập nhật thực đơn mẫu
   */
  async updateTemplate(id, updateData) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID thực đơn mẫu không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    if (
      updateData._id !== undefined &&
      updateData._id.toString() !== id.toString()
    ) {
      const error = new Error("Không được phép thay đổi _id của thực đơn mẫu.");
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

    const template = await MealPlanTemplate.findById(id);
    if (!template) {
      const error = new Error(
        "Không tìm thấy thực đơn mẫu với ID đã cung cấp.",
      );
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
        const error = new Error("Tên thực đơn mẫu không được để trống.");
        error.statusCode = 400;
        throw error;
      }
      updates.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      updates.description =
        updateData.description && typeof updateData.description === "string"
          ? updateData.description.trim()
          : null;
    }

    if (updateData.items !== undefined) {
      if (!Array.isArray(updateData.items)) {
        const error = new Error("Danh sách món ăn (items) phải là một mảng.");
        error.statusCode = 400;
        throw error;
      }

      const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
      const formattedItems = [];

      for (let i = 0; i < updateData.items.length; i++) {
        const item = updateData.items[i];
        if (!item || typeof item !== "object") {
          const error = new Error(
            `Món ăn thứ ${i + 1} trong thực đơn không hợp lệ.`,
          );
          error.statusCode = 400;
          throw error;
        }

        if (!item.meal_type || !validMealTypes.includes(item.meal_type)) {
          const error = new Error(
            `Bữa ăn thứ ${i + 1} có meal_type không hợp lệ. Chỉ chấp nhận: breakfast, lunch, dinner hoặc snack.`,
          );
          error.statusCode = 400;
          throw error;
        }

        if (
          !item.recipe_id ||
          !mongoose.Types.ObjectId.isValid(item.recipe_id)
        ) {
          const error = new Error(
            `Món ăn thứ ${i + 1} có recipe_id không hợp lệ.`,
          );
          error.statusCode = 400;
          throw error;
        }

        const recipeExists = await Recipe.findById(item.recipe_id).lean();
        if (!recipeExists) {
          const error = new Error(
            `Công thức với ID ${item.recipe_id} không tồn tại trong hệ thống.`,
          );
          error.statusCode = 400;
          throw error;
        }

        formattedItems.push({
          meal_type: item.meal_type,
          recipe_id: new mongoose.Types.ObjectId(item.recipe_id),
        });
      }

      updates.items = formattedItems;
    }

    const updatedTemplate = await MealPlanTemplate.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate("created_by_admin_id", "full_name email role")
      .populate(
        "items.recipe_id",
        "title image_url calories_per_serving protein_g carb_g fat_g",
      )
      .lean();

    return updatedTemplate;
  }

  /**
   * Xóa cứng thực đơn mẫu (kèm kiểm tra ràng buộc toàn vẹn)
   */
  async deleteTemplate(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID thực đơn mẫu không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const template = await MealPlanTemplate.findById(id);
    if (!template) {
      const error = new Error(
        "Không tìm thấy thực đơn mẫu với ID đã cung cấp.",
      );
      error.statusCode = 404;
      throw error;
    }

    await MealPlanTemplate.findByIdAndDelete(id);

    return {
      success: true,
      message: `Đã xóa thực đơn mẫu "${template.name}" thành công.`,
    };
  }
}

module.exports = new AdminMealPlanTemplateService();
