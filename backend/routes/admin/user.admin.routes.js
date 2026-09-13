const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/admin.middleware');
const userAdminController = require('../../controllers/admin/user.admin.controller');

// All Admin User Management routes require both JWT Authentication & Admin Role
router.use(authMiddleware);
router.use(adminMiddleware);

// 1. GET /api/admin/users - List users with search, filter, pagination
router.get('/', userAdminController.getUsers);

// 2. GET /api/admin/users/:id - Get single user detail
router.get('/:id', userAdminController.getUserById);

// 3. PUT /api/admin/users/:id/role - Update user role
router.put('/:id/role', userAdminController.updateRole);

module.exports = router;
