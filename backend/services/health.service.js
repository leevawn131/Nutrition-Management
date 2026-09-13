const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculate full age in years from date of birth
 * @param {Date|string} dateOfBirth
 * @param {Date} [referenceDate=new Date()]
 * @returns {number} Age in full years
 */
const calculateAge = (dateOfBirth, referenceDate = new Date()) => {
  if (!dateOfBirth) {
    const error = new Error('Ngày sinh (date_of_birth) không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) {
    const error = new Error('Ngày sinh không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const refDate = new Date(referenceDate);
  if (birthDate > refDate) {
    const error = new Error('Ngày sinh không được là ngày trong tương lai');
    error.statusCode = 400;
    throw error;
  }

  let age = refDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = refDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0) {
    const error = new Error('Tuổi tính toán không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  return age;
};

/**
 * Calculate BMI
 * Formula: BMI = weight_kg / (height_m ^ 2)
 * where height_m = height_cm / 100
 * @param {number} height_cm
 * @param {number} weight_kg
 * @returns {number} BMI value
 */
const calculateBMI = (height_cm, weight_kg) => {
  if (
    height_cm === undefined ||
    height_cm === null ||
    typeof height_cm !== 'number' ||
    isNaN(height_cm) ||
    height_cm <= 0
  ) {
    const error = new Error('Chiều cao (cm) phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  if (
    weight_kg === undefined ||
    weight_kg === null ||
    typeof weight_kg !== 'number' ||
    isNaN(weight_kg) ||
    weight_kg <= 0
  ) {
    const error = new Error('Cân nặng (kg) phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  const height_m = height_cm / 100;
  return weight_kg / (height_m * height_m);
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Male: (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
 * Female: (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
 * @param {Object} params - { gender, height_cm, weight_kg, age, date_of_birth }
 * @returns {number} BMR value
 */
const calculateBMR = ({ gender, height_cm, weight_kg, age, date_of_birth }) => {
  if (!gender) {
    const error = new Error('Giới tính (gender) không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (gender === 'other') {
    const error = new Error(
      'Công thức Mifflin-St Jeor hiện tại chỉ hỗ trợ tính BMR cho giới tính sinh học nam (male) hoặc nữ (female)'
    );
    error.statusCode = 400;
    throw error;
  }

  if (gender !== 'male' && gender !== 'female') {
    const error = new Error('Giới tính không hợp lệ (chỉ chấp nhận: male, female, other)');
    error.statusCode = 400;
    throw error;
  }

  if (
    height_cm === undefined ||
    height_cm === null ||
    typeof height_cm !== 'number' ||
    isNaN(height_cm) ||
    height_cm <= 0
  ) {
    const error = new Error('Chiều cao (cm) phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  if (
    weight_kg === undefined ||
    weight_kg === null ||
    typeof weight_kg !== 'number' ||
    isNaN(weight_kg) ||
    weight_kg <= 0
  ) {
    const error = new Error('Cân nặng (kg) phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  let calculatedAge;
  if (age !== undefined && age !== null) {
    if (typeof age !== 'number' || isNaN(age) || age < 0) {
      const error = new Error('Tuổi phải là số không âm (>= 0)');
      error.statusCode = 400;
      throw error;
    }
    calculatedAge = age;
  } else if (date_of_birth) {
    calculatedAge = calculateAge(date_of_birth);
  } else {
    const error = new Error('Cần cung cấp ngày sinh (date_of_birth) hoặc tuổi (age) để tính BMR');
    error.statusCode = 400;
    throw error;
  }

  if (gender === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * calculatedAge + 5;
  } else {
    return 10 * weight_kg + 6.25 * height_cm - 5 * calculatedAge - 161;
  }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * Formula: TDEE = BMR * activity_factor
 * @param {number} bmr
 * @param {string} activity_level - sedentary, light, moderate, active, very_active
 * @returns {number} TDEE value
 */
const calculateTDEE = (bmr, activity_level) => {
  if (bmr === undefined || bmr === null || typeof bmr !== 'number' || isNaN(bmr) || bmr <= 0) {
    const error = new Error('Chỉ số BMR phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  if (!activity_level) {
    const error = new Error('Mức độ vận động (activity_level) không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const factor = ACTIVITY_FACTORS[activity_level];
  if (!factor) {
    const error = new Error(
      'Mức độ vận động không hợp lệ (chỉ chấp nhận: sedentary, light, moderate, active, very_active)'
    );
    error.statusCode = 400;
    throw error;
  }

  return bmr * factor;
};

/**
 * Calculate Maintenance Calories
 * Currently: maintenanceCalories = TDEE
 * @param {number} tdee
 * @returns {number} maintenance calories
 */
const calculateMaintenanceCalories = (tdee) => {
  if (tdee === undefined || tdee === null || typeof tdee !== 'number' || isNaN(tdee) || tdee <= 0) {
    const error = new Error('Chỉ số TDEE phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  return tdee;
};

/**
 * Calculate all health metrics: BMI, BMR, TDEE, Maintenance Calories
 * @param {Object} data - { gender, date_of_birth, age, height_cm, weight_kg, activity_level }
 * @returns {Object} { bmi, bmr, tdee, maintenanceCalories }
 */
const calculateHealthMetrics = (data) => {
  if (!data || typeof data !== 'object') {
    const error = new Error('Dữ liệu tính toán chỉ số sức khỏe không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const { gender, date_of_birth, age, height_cm, weight_kg, activity_level } = data;

  const bmi = calculateBMI(height_cm, weight_kg);
  const bmr = calculateBMR({ gender, height_cm, weight_kg, age, date_of_birth });
  const tdee = calculateTDEE(bmr, activity_level);
  const maintenanceCalories = calculateMaintenanceCalories(tdee);

  return {
    bmi,
    bmr,
    tdee,
    maintenanceCalories,
  };
};

module.exports = {
  ACTIVITY_FACTORS,
  calculateAge,
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateMaintenanceCalories,
  calculateHealthMetrics,
};
