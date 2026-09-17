const mongoose = require("mongoose");
const Activity = require("../../models/activity.model");
const ActivityLog = require("../../models/activity_log.model");

/**
 * Service quản lý danh mục Hoạt động thể chất cho Admin Portal
 */
const adminActivityService = {
  /**
   * Lấy danh sách hoạt động thể chất (phân trang, tìm kiếm, lọc theo category)
   * @param {Object} params - { page, limit, search, category }
   * @returns {Promise<Object>} { activities, pagination, categories }
   */
  async listActivities({ page = 1, limit = 10, search, category }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {};

    // Tìm kiếm theo tên hoạt động
    if (search && typeof search === "string" && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: sanitizedSearch, $options: "i" };
    }

    // Lọc theo danh mục
    if (category && category !== "all" && category.trim()) {
      filter.category = category.trim();
    }

    const skip = (pageNum - 1) * limitNum;

    const [total, activities, categories] = await Promise.all([
      Activity.countDocuments(filter),
      Activity.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("created_by_admin_id", "full_name email")
        .lean(),
      Activity.distinct("category"),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 0;

    return {
      activities,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
      categories: categories.filter(Boolean),
    };
  },

  /**
   * Lấy chi tiết hoạt động theo ID
   * @param {string} id
   */
  async getActivityById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã hoạt động (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const activity = await Activity.findById(id)
      .populate("created_by_admin_id", "full_name email")
      .lean();

    if (!activity) {
      const error = new Error("Không tìm thấy hoạt động thể chất yêu cầu");
      error.statusCode = 404;
      throw error;
    }

    return activity;
  },

  /**
   * Tạo mới một hoạt động thể chất
   * @param {Object} data - { name, met_value, category }
   * @param {string} adminId - ID của Admin tạo
   */
  async createActivity(data, adminId) {
    const { name, met_value, category } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      const error = new Error("Tên hoạt động không được để trống");
      error.statusCode = 400;
      throw error;
    }

    const metNum = parseFloat(met_value);
    if (isNaN(metNum) || metNum <= 0) {
      const error = new Error("Chỉ số MET phải là một số dương lớn hơn 0");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra tên trùng lặp (không phân biệt hoa thường)
    const existing = await Activity.findOne({
      name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      const error = new Error(`Hoạt động mang tên "${name.trim()}" đã tồn tại trong hệ thống`);
      error.statusCode = 409;
      throw error;
    }

    const newActivity = new Activity({
      name: name.trim(),
      met_value: metNum,
      category: category && category.trim() ? category.trim() : "Tập luyện",
      created_by_admin_id: adminId || null,
      created_at: new Date(),
    });

    await newActivity.save();
    return newActivity.toObject();
  },

  /**
   * Chỉnh sửa hoạt động thể chất
   * @param {string} id
   * @param {Object} data - { name, met_value, category }
   */
  async updateActivity(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã hoạt động (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      const error = new Error("Không tìm thấy hoạt động thể chất cần cập nhật");
      error.statusCode = 404;
      throw error;
    }

    const { name, met_value, category } = data;

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        const error = new Error("Tên hoạt động không được để trống");
        error.statusCode = 400;
        throw error;
      }

      // Kiểm tra tên trùng với hoạt động khác
      const duplicate = await Activity.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (duplicate) {
        const error = new Error(`Hoạt động mang tên "${name.trim()}" đã tồn tại`);
        error.statusCode = 409;
        throw error;
      }
      activity.name = name.trim();
    }

    if (met_value !== undefined) {
      const metNum = parseFloat(met_value);
      if (isNaN(metNum) || metNum <= 0) {
        const error = new Error("Chỉ số MET phải là một số dương lớn hơn 0");
        error.statusCode = 400;
        throw error;
      }
      activity.met_value = metNum;
    }

    if (category !== undefined) {
      activity.category = category && category.trim() ? category.trim() : "Tập luyện";
    }

    await activity.save();
    return activity.toObject();
  },

  /**
   * Xóa một hoạt động thể chất
   * @param {string} id
   */
  async deleteActivity(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Mã hoạt động (ID) không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      const error = new Error("Không tìm thấy hoạt động thể chất cần xóa");
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra xem đã có nhật ký ghi nhận (activity_logs) tham chiếu tới hoạt động này chưa
    if (ActivityLog) {
      const logCount = await ActivityLog.countDocuments({ activity_id: id });
      if (logCount > 0) {
        const error = new Error(
          `Không thể xóa bài tập này vì đã có ${logCount} lượt người dùng ghi nhận nhật ký vận động liên quan.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    await Activity.findByIdAndDelete(id);
    return { success: true, message: `Đã xóa hoạt động "${activity.name}" thành công` };
  },
};

module.exports = adminActivityService;
