const express = require("express");
const router = express.Router();
const achievementAdminController = require("../../controllers/admin/achievement.admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const adminMiddleware = require("../../middlewares/admin.middleware");

// Bảo vệ tất cả các endpoints quản trị danh hiệu bằng JWT và quyền Admin
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/achievements - Danh sách danh hiệu
router.get("/", achievementAdminController.listAchievements);

// [GET] /api/admin/achievements/:id - Chi tiết danh hiệu
router.get("/:id", achievementAdminController.getAchievementById);

// [POST] /api/admin/achievements - Tạo danh hiệu mới
router.post("/", achievementAdminController.createAchievement);

// [PUT] /api/admin/achievements/:id - Cập nhật danh hiệu
router.put("/:id", achievementAdminController.updateAchievement);

// [DELETE] /api/admin/achievements/:id - Xóa danh hiệu
router.delete("/:id", achievementAdminController.deleteAchievement);

module.exports = router;
