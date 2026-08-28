const express = require('express');
const router = express.Router();
const recipeAdminController = require('../../controllers/admin/recipe.admin.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/admin.middleware');

// Áp dụng xác thực JWT & phân quyền Admin cho toàn bộ route
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/recipes - Danh sách công thức (phân trang, tìm kiếm, lọc)
router.get('/', recipeAdminController.listRecipes);

// [GET] /api/admin/recipes/:id - Chi tiết công thức
router.get('/:id', recipeAdminController.getRecipeById);

// [POST] /api/admin/recipes - Tạo công thức hệ thống mới
router.post('/', recipeAdminController.createRecipe);

// [PUT] /api/admin/recipes/:id - Chỉnh sửa công thức
router.put('/:id', recipeAdminController.updateRecipe);

// [PUT] /api/admin/recipes/:id/status - Duyệt/Từ chối công thức cộng đồng
router.put('/:id/status', recipeAdminController.updateRecipeStatus);

// [DELETE] /api/admin/recipes/:id - Xóa cứng công thức (kèm kiểm tra tham chiếu)
router.delete('/:id', recipeAdminController.deleteRecipe);

module.exports = router;
