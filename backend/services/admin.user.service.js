const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * Service to manage User administration
 */
const adminUserService = {
  /**
   * Get paginated, filtered, and searched list of users
   * @param {Object} params - { page, limit, search, role }
   * @returns {Promise<Object>} { users, pagination }
   */
  async getUsersList({ page = 1, limit = 10, search, role }) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error('Tham số page phải là số nguyên dương >= 1');
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      const error = new Error('Tham số limit phải nằm trong khoảng từ 1 đến 100');
      error.statusCode = 400;
      throw error;
    }

    const query = {};

    // Filter by role if specified
    if (role !== undefined && role !== null && role !== '') {
      if (!['user', 'admin'].includes(role)) {
        const error = new Error("Tham số role chỉ chấp nhận giá trị 'user' hoặc 'admin'");
        error.statusCode = 400;
        throw error;
      }
      query.role = role;
    }

    // Search by email or full_name (case-insensitive regex)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { full_name: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password_hash')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 0;

    return {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  },

  /**
   * Get detailed profile of a user by ID
   * @param {string} id - MongoDB ObjectId
   * @returns {Promise<Object>} User document without password_hash
   */
  async getUserDetailById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('User ID không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(id).select('-password_hash');

    if (!user) {
      const error = new Error('Không tìm thấy người dùng với ID đã cung cấp');
      error.statusCode = 404;
      throw error;
    }

    return user;
  },

  /**
   * Update user role (promote to admin or demote to user)
   * @param {string} adminUserId - ID of the requesting admin
   * @param {string} targetUserId - ID of the target user to update
   * @param {string} newRole - 'user' | 'admin'
   * @returns {Promise<Object>} Updated user document
   */
  async updateUserRole(adminUserId, targetUserId, newRole) {
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error = new Error('User ID không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    if (!newRole || !['user', 'admin'].includes(newRole)) {
      const error = new Error("Vai trò mới (role) phải là 'user' hoặc 'admin'");
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      const error = new Error('Không tìm thấy người dùng cần cập nhật');
      error.statusCode = 404;
      throw error;
    }

    // Security Rule 1: Admin cannot demote themselves
    if (adminUserId.toString() === targetUserId.toString() && newRole === 'user') {
      const error = new Error('Quản trị viên không thể tự hạ quyền của chính mình.');
      error.statusCode = 400;
      throw error;
    }

    // Security Rule 2: Cannot demote the last remaining admin in the system
    if (targetUser.role === 'admin' && newRole === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        const error = new Error(
          'Không thể hạ quyền vì đây là tài khoản Quản trị viên duy nhất còn lại trong hệ thống.'
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Update role only
    targetUser.role = newRole;
    await targetUser.save();

    // Return sanitized user
    const updatedUser = await User.findById(targetUserId).select('-password_hash');
    return updatedUser;
  },
};

module.exports = adminUserService;
