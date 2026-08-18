const bcrypt = require('bcryptjs');
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

module.exports = {
  registerUser,
};
