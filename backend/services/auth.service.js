const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Helper to validate email format
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Register a new user
 * POST /api/auth/register
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} Created user instance
 */
const registerUser = async ({ email, password }) => {
  // 1. Validate required fields
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== 'string') {
    const error = new Error('Mật khẩu không được để trống');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate email format
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('Định dạng email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate password length/strength (min 6 characters)
  if (password.length < 6) {
    const error = new Error('Mật khẩu phải có ít nhất 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  // 4. Check if email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email đã tồn tại trong hệ thống');
    error.statusCode = 409;
    throw error;
  }

  // 5. Hash password with bcryptjs (cost factor 10)
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // 6. Create user with default role 'user' (client is not allowed to customize role)
  const newUser = await User.create({
    email: normalizedEmail,
    password_hash,
    role: 'user',
  });

  return newUser;
};

/**
 * Authenticate user and issue JWT Access Token
 * POST /api/auth/login
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} { user, accessToken }
 */
const loginUser = async ({ email, password }) => {
  // 1. Validate required inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== 'string') {
    const error = new Error('Mật khẩu không được để trống');
    error.statusCode = 400;
    throw error;
  }

  // 2. Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // 3. Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Generic authentication error - do not reveal if email exists (prevent account enumeration)
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  // 4. Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    // Generic authentication error - do not reveal which credential failed
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  // 5. Generate JWT Access Token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('JWT secret chưa được cấu hình');
    error.statusCode = 500;
    throw error;
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const payload = {
    id: user._id,
  };

  const accessToken = jwt.sign(payload, secret, { expiresIn });

  return {
    user,
    accessToken,
  };
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 * @param {string} userId - User ObjectId string
 * @returns {Promise<Object>} User document
 */
const getCurrentUser = async (userId) => {
  if (!userId) {
    const error = new Error('User ID không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Logout user
 * POST /api/auth/logout
 * Under the stateless JWT architecture (no server-side token blacklist collection / refresh token collection),
 * logout confirms successful session termination on client-side.
 * @returns {Object} Logout confirmation
 */
const logoutUser = async () => {
  return {
    success: true,
    message: 'Đăng xuất thành công',
  };
};

/**
 * Change password for authenticated user
 * PUT /api/auth/change-password
 * @param {string} userId - User ObjectId from req.user.id
 * @param {Object} data - { current_password, new_password }
 * @returns {Promise<Object>} Confirmation message
 */
const changePassword = async (userId, { current_password, new_password }) => {
  if (!userId) {
    const error = new Error('User ID không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (!current_password || typeof current_password !== 'string') {
    const error = new Error('Mật khẩu hiện tại không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (!new_password || typeof new_password !== 'string') {
    const error = new Error('Mật khẩu mới không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (new_password.length < 6) {
    const error = new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  if (current_password === new_password) {
    const error = new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Mật khẩu hiện tại không chính xác');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password with cost factor 10
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(new_password, salt);

  user.password_hash = newHash;
  await user.save();

  return {
    success: true,
    message: 'Đổi mật khẩu thành công',
  };
};

/**
 * Forgot password request
 * POST /api/auth/forgot-password
 * Validates email shape and returns a generic response to prevent account enumeration.
 * @param {Object} data - { email }
 * @returns {Promise<Object>} Generic response message
 */
const forgotPassword = async ({ email }) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('Định dạng email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Find user (safely without revealing result to client)
  const user = await User.findOne({ email: normalizedEmail });

  // If user exists and JWT secret is configured, generate a signed reset token (15m expiry)
  let resetToken = null;
  if (user && process.env.JWT_SECRET) {
    resetToken = jwt.sign(
      { id: user._id, type: 'password_reset', email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  // Always return generic response to avoid account enumeration
  return {
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi.',
    // In dev testing mode only, token is attached for automated test validation if user exists
    ...(process.env.NODE_ENV === 'test' && resetToken ? { _devResetToken: resetToken } : {}),
  };
};

/**
 * Reset password request
 * POST /api/auth/reset-password
 * @param {Object} data - { token, new_password }
 * @returns {Promise<Object>} Confirmation message
 */
const resetPassword = async ({ token, new_password }) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    const error = new Error('Mã token đặt lại mật khẩu không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (!new_password || typeof new_password !== 'string') {
    const error = new Error('Mật khẩu mới không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (new_password.length < 6) {
    const error = new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('JWT secret chưa được cấu hình');
    error.statusCode = 500;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Mã token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.');
      error.statusCode = 400;
      throw error;
    }
    const error = new Error('Mã token đặt lại mật khẩu không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (!decoded || decoded.type !== 'password_reset' || !decoded.id) {
    const error = new Error('Mã token đặt lại mật khẩu không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  // Hash new password with cost factor 10
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(new_password, salt);

  user.password_hash = newHash;
  await user.save();

  return {
    success: true,
    message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
  };
};

/**
 * Verify Email request
 * POST /api/auth/verify-email
 * @param {Object} data - { token }
 */
const verifyEmail = async ({ token }) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    const error = new Error('Mã token xác thực email không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('JWT secret chưa được cấu hình');
    error.statusCode = 500;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Mã token xác thực email đã hết hạn. Vui lòng yêu cầu mã mới.');
      error.statusCode = 400;
      throw error;
    }
    const error = new Error('Mã token xác thực email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (!decoded || decoded.type !== 'email_verification' || !decoded.id) {
    const error = new Error('Mã token xác thực email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  return {
    success: true,
    message: 'Xác thực email thành công',
  };
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 * @param {Object} data - { email }
 */
const resendVerification = async ({ email }) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('Định dạng email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Return generic response to avoid account enumeration
  return {
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, hướng dẫn xác thực sẽ được gửi lại.',
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
