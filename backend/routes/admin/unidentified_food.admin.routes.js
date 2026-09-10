const express = require("express");
const router = express.Router();
const unidentifiedFoodAdminController = require("../../controllers/admin/unidentified_food.admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const adminMiddleware = require("../../middlewares/admin.middleware");

// Toàn bộ routes yêu cầu JWT Token + Role Admin
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/unidentified-foods - Danh sách & Lọc
router.get("/", unidentifiedFoodAdminController.getUnidentifiedFoods);

// [GET] /api/admin/unidentified-foods/:id - Chi tiết
router.get("/:id", unidentifiedFoodAdminController.getUnidentifiedFoodById);

// [PUT] /api/admin/unidentified-foods/:id/resolve - Chuẩn hóa (gán món có sẵn hoặc tạo món mới)
router.put(
  "/:id/resolve",
  unidentifiedFoodAdminController.resolveUnidentifiedFood,
);

// [DELETE] /api/admin/unidentified-foods/:id - Xóa báo cáo
router.delete("/:id", unidentifiedFoodAdminController.deleteUnidentifiedFood);

module.exports = router;
