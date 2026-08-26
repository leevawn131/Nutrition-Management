const adminUserService = require('../../services/admin.user.service');

/**
 * Controller to handle Admin User Management requests
 */
const userAdminController = {
  /**
   * Handle GET /api/admin/users
   */
  async getUsers(req, res) {
    try {
      const { page, limit, search, role } = req.query;

      const result = await adminUserService.getUsersList({
        page,
        limit,
        search,
        role,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Unhandled getUsers error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ nội bộ khi lấy danh sách người dùng.',
      });
    }
  },

  /**
   * Handle GET /api/admin/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await adminUserService.getUserDetailById(id);

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Unhandled getUserById error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ nội bộ khi lấy chi tiết người dùng.',
      });
    }
  },

  /**
   * Handle PUT /api/admin/users/:id/role
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminUserId = req.user && req.user.id;

      const updatedUser = await adminUserService.updateUserRole(adminUserId, id, role);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật vai trò người dùng thành công',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Unhandled updateRole error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ nội bộ khi cập nhật vai trò người dùng.',
      });
    }
  },
};

module.exports = userAdminController;
