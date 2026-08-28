const express = require('express');
const router = express.Router();
const mealPlanTemplateAdminController = require('../../controllers/admin/meal_plan_template.admin.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/admin.middleware');

// Áp dụng xác thực JWT & phân quyền Admin cho toàn bộ route
router.use(authMiddleware, adminMiddleware);

// [GET] /api/admin/meal-plan-templates - Danh sách thực đơn mẫu
router.get('/', mealPlanTemplateAdminController.listTemplates);

// [GET] /api/admin/meal-plan-templates/:id - Chi tiết thực đơn mẫu
router.get('/:id', mealPlanTemplateAdminController.getTemplateById);

// [POST] /api/admin/meal-plan-templates - Tạo thực đơn mẫu mới
router.post('/', mealPlanTemplateAdminController.createTemplate);

// [PUT] /api/admin/meal-plan-templates/:id - Cập nhật thực đơn mẫu
router.put('/:id', mealPlanTemplateAdminController.updateTemplate);

// [DELETE] /api/admin/meal-plan-templates/:id - Xóa thực đơn mẫu
router.delete('/:id', mealPlanTemplateAdminController.deleteTemplate);

module.exports = router;
