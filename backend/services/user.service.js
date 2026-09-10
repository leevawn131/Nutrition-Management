const User = require('../models/user.model');

const ALLOWED_GENDERS = ['male', 'female', 'other', null];
const ALLOWED_ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active', null];
const ALLOWED_PREFERENCE_TYPES = ['diet_type', 'allergy', 'favorite', 'dislike'];

/**
 * Get current user profile
 * @param {string} userId - User ObjectId
 * @returns {Promise<Object>} User document
 */
const getUserProfile = async (userId) => {
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
 * Update current user profile
 * Profile Module owns: full_name, avatar_url, gender, date_of_birth, height_cm, weight_kg, activity_level, food_preferences
 * Goal Module owns: goal, target_calories
 * Not implemented yet: target_protein_g, target_carb_g, target_fat_g
 *
 * @param {string} userId - User ObjectId
 * @param {Object} updateData - Profile data to update
 * @returns {Promise<Object>} Updated user document
 */
const updateUserProfile = async (userId, updateData) => {
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

  if (!updateData || typeof updateData !== 'object') {
    const error = new Error('Dữ liệu cập nhật không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Enforce clear module ownership: reject attempts to modify Goal or unfinalized macro fields via Profile API
  if (updateData.goal !== undefined) {
    const error = new Error(
      'Trường "goal" thuộc quyền quản lý của Goal module. Vui lòng sử dụng Goal API để cập nhật mục tiêu.'
    );
    error.statusCode = 400;
    throw error;
  }

  if (updateData.target_calories !== undefined) {
    const error = new Error(
      'Trường "target_calories" thuộc quyền quản lý của Goal module. Vui lòng sử dụng Goal API để cập nhật calo mục tiêu.'
    );
    error.statusCode = 400;
    throw error;
  }



  if (
    updateData.role !== undefined ||
    updateData.email !== undefined ||
    updateData.password_hash !== undefined
  ) {
    const error = new Error(
      'Không được phép chỉnh sửa các trường định danh hoặc phân quyền bảo mật qua Profile API.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 1. Validate full_name
  if (updateData.full_name !== undefined) {
    if (updateData.full_name !== null && typeof updateData.full_name !== 'string') {
      const error = new Error('Họ tên phải là chuỗi ký tự hoặc null');
      error.statusCode = 400;
      throw error;
    }
    user.full_name = updateData.full_name ? updateData.full_name.trim() : null;
  }

  // 2. Validate avatar_url
  if (updateData.avatar_url !== undefined) {
    if (updateData.avatar_url !== null && typeof updateData.avatar_url !== 'string') {
      const error = new Error('Đường dẫn ảnh đại diện phải là chuỗi ký tự hoặc null');
      error.statusCode = 400;
      throw error;
    }
    user.avatar_url = updateData.avatar_url ? updateData.avatar_url.trim() : null;
  }

  // 3. Validate gender
  if (updateData.gender !== undefined) {
    if (!ALLOWED_GENDERS.includes(updateData.gender)) {
      const error = new Error('Giới tính không hợp lệ (chỉ chấp nhận: male, female, other, null)');
      error.statusCode = 400;
      throw error;
    }
    user.gender = updateData.gender;
  }

  // 4. Validate date_of_birth
  if (updateData.date_of_birth !== undefined) {
    if (updateData.date_of_birth !== null) {
      const parsedDate = new Date(updateData.date_of_birth);
      if (isNaN(parsedDate.getTime())) {
        const error = new Error('Ngày sinh không hợp lệ');
        error.statusCode = 400;
        throw error;
      }
      if (parsedDate > new Date()) {
        const error = new Error('Ngày sinh không được là ngày trong tương lai');
        error.statusCode = 400;
        throw error;
      }
      user.date_of_birth = parsedDate;
    } else {
      user.date_of_birth = null;
    }
  }

  // 5. Validate height_cm (must be > 0 when provided)
  if (updateData.height_cm !== undefined) {
    if (updateData.height_cm !== null) {
      if (typeof updateData.height_cm !== 'number' || isNaN(updateData.height_cm) || updateData.height_cm <= 0) {
        const error = new Error('Chiều cao (cm) phải là số dương lớn hơn 0');
        error.statusCode = 400;
        throw error;
      }
      user.height_cm = updateData.height_cm;
    } else {
      user.height_cm = null;
    }
  }

  // 6. Validate weight_kg (must be > 0 when provided)
  if (updateData.weight_kg !== undefined) {
    if (updateData.weight_kg !== null) {
      if (typeof updateData.weight_kg !== 'number' || isNaN(updateData.weight_kg) || updateData.weight_kg <= 0) {
        const error = new Error('Cân nặng (kg) phải là số dương lớn hơn 0');
        error.statusCode = 400;
        throw error;
      }
      user.weight_kg = updateData.weight_kg;
    } else {
      user.weight_kg = null;
    }
  }

  // 7. Validate activity_level
  if (updateData.activity_level !== undefined) {
    if (!ALLOWED_ACTIVITY_LEVELS.includes(updateData.activity_level)) {
      const error = new Error(
        'Mức độ vận động không hợp lệ (chỉ chấp nhận: sedentary, light, moderate, active, very_active, null)'
      );
      error.statusCode = 400;
      throw error;
    }
    user.activity_level = updateData.activity_level;
  }

  // 8. Validate food_preferences
  if (updateData.food_preferences !== undefined) {
    if (!Array.isArray(updateData.food_preferences)) {
      const error = new Error('Sở thích ăn uống phải là một danh sách (mảng)');
      error.statusCode = 400;
      throw error;
    }

    const sanitizedPreferences = [];
    for (let i = 0; i < updateData.food_preferences.length; i++) {
      const pref = updateData.food_preferences[i];
      if (!pref || typeof pref !== 'object') {
        const error = new Error(`Mục sở thích ăn uống thứ ${i + 1} không hợp lệ`);
        error.statusCode = 400;
        throw error;
      }

      if (!ALLOWED_PREFERENCE_TYPES.includes(pref.preference_type)) {
        const error = new Error(
          `Loại sở thích (preference_type) '${pref.preference_type}' không hợp lệ (chỉ chấp nhận: diet_type, allergy, favorite, dislike)`
        );
        error.statusCode = 400;
        throw error;
      }

      if (!pref.value || typeof pref.value !== 'string' || !pref.value.trim()) {
        const error = new Error(`Giá trị sở thích ăn uống thứ ${i + 1} không được để trống`);
        error.statusCode = 400;
        throw error;
      }

      sanitizedPreferences.push({
        preference_type: pref.preference_type,
        value: pref.value.trim(),
      });
    }

    user.food_preferences = sanitizedPreferences;
  }

  // 9. Validate & update macro targets if provided
  if (updateData.target_protein_g !== undefined) {
    if (updateData.target_protein_g !== null) {
      if (typeof updateData.target_protein_g !== 'number' || isNaN(updateData.target_protein_g) || updateData.target_protein_g < 0) {
        const error = new Error('Mục tiêu protein (g) phải là số không âm');
        error.statusCode = 400;
        throw error;
      }
      user.target_protein_g = updateData.target_protein_g;
    } else {
      user.target_protein_g = null;
    }
  }

  if (updateData.target_carb_g !== undefined) {
    if (updateData.target_carb_g !== null) {
      if (typeof updateData.target_carb_g !== 'number' || isNaN(updateData.target_carb_g) || updateData.target_carb_g < 0) {
        const error = new Error('Mục tiêu carb (g) phải là số không âm');
        error.statusCode = 400;
        throw error;
      }
      user.target_carb_g = updateData.target_carb_g;
    } else {
      user.target_carb_g = null;
    }
  }

  if (updateData.target_fat_g !== undefined) {
    if (updateData.target_fat_g !== null) {
      if (typeof updateData.target_fat_g !== 'number' || isNaN(updateData.target_fat_g) || updateData.target_fat_g < 0) {
        const error = new Error('Mục tiêu chất béo (g) phải là số không âm');
        error.statusCode = 400;
        throw error;
      }
      user.target_fat_g = updateData.target_fat_g;
    } else {
      user.target_fat_g = null;
    }
  }

  // Save updated user (timestamps will automatically update updated_at)
  await user.save();

  return user;
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
