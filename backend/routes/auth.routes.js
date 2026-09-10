const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authController.resendVerification);

// Protected routes (Require valid Bearer token via authMiddleware)
// GET /api/auth/me
router.get('/me', authMiddleware, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
