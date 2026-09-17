const express = require("express");
const router = express.Router();
const activityAdminController = require("../../controllers/admin/activity.admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const adminMiddleware = require("../../middlewares/admin.middleware");

// Bảo vệ tất cả các endpoints quản trị bài tập bằng JWT và phân quyền Admin
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/activities - Danh sách hoạt động (phân trang, tìm kiếm, lọc theo category)
router.get("/", activityAdminController.listActivities);

// [GET] /api/admin/activities/:id - Chi tiết hoạt động
router.get("/:id", activityAdminController.getActivityById);

// [POST] /api/admin/activities - Thêm hoạt động mới
router.post("/", activityAdminController.createActivity);

// [PUT] /api/admin/activities/:id - Cập nhật thông tin hoạt động
router.put("/:id", activityAdminController.updateActivity);

// [DELETE] /api/admin/activities/:id - Xóa hoạt động
router.delete("/:id", activityAdminController.deleteActivity);

module.exports = router;
