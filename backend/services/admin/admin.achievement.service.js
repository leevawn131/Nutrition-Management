const mongoose = require("mongoose");
const Achievement = require("../../models/achievement.model");

const VALID_CONDITION_TYPES = [
  "points",
  "streak",
  "posts",
  "comments",
  "likes_received",
  "friends",
  "custom",
];

/**
 * Service quản lý Danh hiệu / Thành tích cho Admin Portal
 */
const adminAchievementService = {
  /**
   * Lấy danh sách danh hiệu (phân trang, tìm kiếm, lọc theo loại điều kiện)
   * @param {Object} params - { page, limit, search, condition_type }
   */
  async listAchievements({ page = 1, limit = 10, search, condition_type }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {};

    // Tìm kiếm theo tên hoặc mô tả
    if (search && typeof search === "string" && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // Lọc theo loại điều kiện
    if (condition_type && condition_type !== "all" && VALID_CONDITION_TYPES.includes(condition_type)) {
      filter["condition.type"] = condition_type;
    }

    const skip = (pageNum - 1) * limitNum;

    const [total, achievements] = await Promise.all([
      Achievement.countDocuments(filter),
      Achievement.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 0;

    return {
      achievements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
      conditionTypes: VALID_CONDITION_TYPES,
    };
  },

  /**
   * Lấy chi tiết danh hiệu theo ID
   * @param {string} id
   */
  async getAchievementById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã danh hiệu (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const achievement = await Achievement.findById(id).lean();
    if (!achievement) {
      const error = new Error("Không tìm thấy danh hiệu yêu cầu");
      error.statusCode = 404;
      throw error;
    }

    return achievement;
  },

  /**
   * Tạo mới một danh hiệu
   * @param {Object} data - { name, description, icon, condition: { type, threshold } }
   */
  async createAchievement(data) {
    const { name, description, icon, condition } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      const error = new Error("Tên danh hiệu không được để trống");
      error.statusCode = 400;
      throw error;
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      const error = new Error("Mô tả danh hiệu không được để trống");
      error.statusCode = 400;
      throw error;
    }

    if (!condition || typeof condition !== "object") {
      const error = new Error("Cấu hình điều kiện danh hiệu là bắt buộc");
      error.statusCode = 400;
      throw error;
    }

    const { type, threshold } = condition;
    if (!type || !VALID_CONDITION_TYPES.includes(type)) {
      const error = new Error(
        `Loại điều kiện không hợp lệ. Phải là một trong: ${VALID_CONDITION_TYPES.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    const thresholdNum = parseInt(threshold, 10);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      const error = new Error("Ngưỡng điều kiện (threshold) phải là số nguyên >= 0");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra tên danh hiệu trùng lặp
    const existing = await Achievement.findOne({
      name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      const error = new Error(`Danh hiệu "${name.trim()}" đã tồn tại trong hệ thống`);
      error.statusCode = 409;
      throw error;
    }

    const newAchievement = new Achievement({
      name: name.trim(),
      description: description.trim(),
      icon: icon && icon.trim() ? icon.trim() : "🏆",
      condition: {
        type,
        threshold: thresholdNum,
      },
      created_at: new Date(),
    });

    await newAchievement.save();
    return newAchievement.toObject();
  },

  /**
   * Cập nhật thông tin danh hiệu
   * @param {string} id
   * @param {Object} data
   */
  async updateAchievement(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã danh hiệu (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      const error = new Error("Không tìm thấy danh hiệu cần cập nhật");
      error.statusCode = 404;
      throw error;
    }

    const { name, description, icon, condition } = data;

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        const error = new Error("Tên danh hiệu không được để trống");
        error.statusCode = 400;
        throw error;
      }

      const duplicate = await Achievement.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (duplicate) {
        const error = new Error(`Danh hiệu mang tên "${name.trim()}" đã tồn tại`);
        error.statusCode = 409;
        throw error;
      }
      achievement.name = name.trim();
    }

    if (description !== undefined) {
      if (!description || typeof description !== "string" || !description.trim()) {
        const error = new Error("Mô tả danh hiệu không được để trống");
        error.statusCode = 400;
        throw error;
      }
      achievement.description = description.trim();
    }

    if (icon !== undefined) {
      achievement.icon = icon && icon.trim() ? icon.trim() : "🏆";
    }

    if (condition !== undefined && typeof condition === "object") {
      const { type, threshold } = condition;
      if (type !== undefined) {
        if (!VALID_CONDITION_TYPES.includes(type)) {
          const error = new Error(
            `Loại điều kiện không hợp lệ. Phải là một trong: ${VALID_CONDITION_TYPES.join(", ")}`
          );
          error.statusCode = 400;
          throw error;
        }
        achievement.condition.type = type;
      }

      if (threshold !== undefined) {
        const thresholdNum = parseInt(threshold, 10);
        if (isNaN(thresholdNum) || thresholdNum < 0) {
          const error = new Error("Ngưỡng điều kiện (threshold) phải là số nguyên >= 0");
          error.statusCode = 400;
          throw error;
        }
        achievement.condition.threshold = thresholdNum;
      }
    }

    await achievement.save();
    return achievement.toObject();
  },

  /**
   * Xóa một danh hiệu
   * @param {string} id
   */
  async deleteAchievement(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã danh hiệu (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      const error = new Error("Không tìm thấy danh hiệu cần xóa");
      error.statusCode = 404;
      throw error;
    }

    await Achievement.findByIdAndDelete(id);
    return { success: true, message: `Đã xóa danh hiệu "${achievement.name}" thành công` };
  },
};

module.exports = adminAchievementService;
