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

  // 3. Validate password length/strength
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

  // 5. Hash password with bcryptjs
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
    // Generic authentication error - do not reveal if email exists
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

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
