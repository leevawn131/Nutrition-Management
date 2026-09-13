const express = require("express");
const router = express.Router();
const reportAdminController = require("../../controllers/admin/report.admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const adminMiddleware = require("../../middlewares/admin.middleware");

// Bảo vệ toàn bộ endpoint báo cáo bởi JWT + Quyền Admin
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/reports/overview - Số liệu KPI tổng quan toàn hệ thống
router.get("/overview", reportAdminController.getOverview);

// [GET] /api/admin/reports/users - Phân tích người dùng & tăng trưởng theo thời gian
router.get("/users", reportAdminController.getUserReports);

// [GET] /api/admin/reports/foods - Phân tích thực phẩm & tình trạng xác thực
router.get("/foods", reportAdminController.getFoodReports);

// [GET] /api/admin/reports/recipes - Phân tích công thức món ăn & thực đơn mẫu
router.get("/recipes", reportAdminController.getRecipeReports);

module.exports = router;
