/**
 * Goal / Nutrition Target Calculation Service
 *
 * NOTE ON ENERGY DENSITY APPROXIMATION:
 * The constant KCAL_PER_KG_APPROX = 7700 represents the widely used MVP heuristic
 * (Wishnofsky rule approximation) where ~7,700 kcal equates to roughly 1 kg of
 * body-weight tissue change. This is an engineering/heuristic approximation
 * for the MVP and not an absolute physiological law for all individuals.
 */
const KCAL_PER_KG_APPROX = 7700;

const ALLOWED_GOALS = ['lose', 'maintain', 'gain'];

/**
 * Validate inputs for goal calculation
 * @param {Object} params
 */
const validateGoalInput = ({ goal, current_weight, target_weight, target_duration_weeks, tdee }) => {
  if (!goal || typeof goal !== 'string' || !ALLOWED_GOALS.includes(goal)) {
    const error = new Error('Mục tiêu (goal) không hợp lệ (chỉ chấp nhận: lose, maintain, gain)');
    error.statusCode = 400;
    throw error;
  }

  if (
    current_weight === undefined ||
    current_weight === null ||
    typeof current_weight !== 'number' ||
    isNaN(current_weight) ||
    current_weight <= 0
  ) {
    const error = new Error('Cân nặng hiện tại (current_weight) phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  if (tdee === undefined || tdee === null || typeof tdee !== 'number' || isNaN(tdee) || tdee <= 0) {
    const error = new Error('Chỉ số TDEE phải là số dương lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  if (goal === 'lose') {
    if (
      target_weight === undefined ||
      target_weight === null ||
      typeof target_weight !== 'number' ||
      isNaN(target_weight) ||
      target_weight <= 0
    ) {
      const error = new Error('Cân nặng mục tiêu (target_weight) phải là số dương lớn hơn 0');
      error.statusCode = 400;
      throw error;
    }

    if (target_weight >= current_weight) {
      const error = new Error(
        'Với mục tiêu giảm cân (lose), cân nặng mục tiêu phải nhỏ hơn cân nặng hiện tại'
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      target_duration_weeks === undefined ||
      target_duration_weeks === null ||
      typeof target_duration_weeks !== 'number' ||
      isNaN(target_duration_weeks) ||
      target_duration_weeks <= 0
    ) {
      const error = new Error('Thời gian thực hiện (target_duration_weeks) phải là số dương lớn hơn 0 tuần');
      error.statusCode = 400;
      throw error;
    }
  }

  if (goal === 'gain') {
    if (
      target_weight === undefined ||
      target_weight === null ||
      typeof target_weight !== 'number' ||
      isNaN(target_weight) ||
      target_weight <= 0
    ) {
      const error = new Error('Cân nặng mục tiêu (target_weight) phải là số dương lớn hơn 0');
      error.statusCode = 400;
      throw error;
    }

    if (target_weight <= current_weight) {
      const error = new Error(
        'Với mục tiêu tăng cân (gain), cân nặng mục tiêu phải lớn hơn cân nặng hiện tại'
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      target_duration_weeks === undefined ||
      target_duration_weeks === null ||
      typeof target_duration_weeks !== 'number' ||
      isNaN(target_duration_weeks) ||
      target_duration_weeks <= 0
    ) {
      const error = new Error('Thời gian thực hiện (target_duration_weeks) phải là số dương lớn hơn 0 tuần');
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Calculate absolute weight change required
 * @param {number} current_weight
 * @param {number} target_weight
 * @returns {number}
 */
const calculateWeightChange = (current_weight, target_weight) => {
  if (target_weight === undefined || target_weight === null) {
    return 0;
  }
  return Math.abs(current_weight - target_weight);
};

/**
 * Calculate desired weight change per week
 * @param {number} weight_change
 * @param {number} target_duration_weeks
 * @returns {number}
 */
const calculateDesiredWeeklyWeightChange = (weight_change, target_duration_weeks) => {
  if (!target_duration_weeks || target_duration_weeks <= 0) {
    return 0;
  }
  return weight_change / target_duration_weeks;
};

/**
 * Calculate daily calorie adjustment based on weekly weight change rate
 * Formula: (weekly_weight_change * 7700) / 7
 * @param {number} desired_weekly_weight_change
 * @returns {number}
 */
const calculateDailyCalorieAdjustment = (desired_weekly_weight_change) => {
  const weeklyEnergyAdjustment = desired_weekly_weight_change * KCAL_PER_KG_APPROX;
  return weeklyEnergyAdjustment / 7;
};

/**
 * Calculate recommended target calories
 * @param {number} tdee
 * @param {number} daily_energy_adjustment
 * @param {string} goal - 'lose' | 'maintain' | 'gain'
 * @returns {number}
 */
const calculateRecommendedTargetCalories = (tdee, daily_energy_adjustment, goal) => {
  if (goal === 'maintain') {
    return tdee;
  }

  if (goal === 'lose') {
    const recommended = tdee - daily_energy_adjustment;
    // Feasibility check: if calorie target becomes <= 0 or deficit is impossible
    if (recommended <= 0) {
      const error = new Error(
        'Mục tiêu không khả thi với khoảng thời gian đã chọn. Vui lòng tăng thời gian thực hiện mục tiêu.'
      );
      error.statusCode = 400;
      throw error;
    }
    return recommended;
  }

  if (goal === 'gain') {
    return tdee + daily_energy_adjustment;
  }

  const error = new Error('Mục tiêu không hợp lệ');
  error.statusCode = 400;
  throw error;
};

/**
 * Main function to calculate complete goal recommendation
 * @param {Object} params - { goal, current_weight, target_weight, target_duration_weeks, tdee }
 * @returns {Object}
 */
const calculateGoalRecommendation = ({
  goal,
  current_weight,
  target_weight,
  target_duration_weeks,
  tdee,
}) => {
  // 1. Validate all inputs
  validateGoalInput({ goal, current_weight, target_weight, target_duration_weeks, tdee });

  // 2. Handle maintain case
  if (goal === 'maintain') {
    return {
      goal: 'maintain',
      currentWeight: current_weight,
      targetWeight: target_weight !== undefined && target_weight !== null ? target_weight : current_weight,
      targetDurationWeeks: target_duration_weeks !== undefined && target_duration_weeks !== null ? target_duration_weeks : null,
      weightChange: 0,
      desiredWeeklyWeightChange: 0,
      dailyCalorieAdjustment: 0,
      recommendedTargetCalories: tdee,
    };
  }

  // 3. Handle lose and gain cases
  const weightChange = calculateWeightChange(current_weight, target_weight);
  const desiredWeeklyWeightChange = calculateDesiredWeeklyWeightChange(weightChange, target_duration_weeks);
  const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(desiredWeeklyWeightChange);
  const recommendedTargetCalories = calculateRecommendedTargetCalories(tdee, dailyCalorieAdjustment, goal);

  return {
    goal,
    currentWeight: current_weight,
    targetWeight: target_weight,
    targetDurationWeeks: target_duration_weeks,
    weightChange,
    desiredWeeklyWeightChange,
    dailyCalorieAdjustment,
    recommendedTargetCalories,
  };
};

module.exports = {
  KCAL_PER_KG_APPROX,
  ALLOWED_GOALS,
  validateGoalInput,
  calculateWeightChange,
  calculateDesiredWeeklyWeightChange,
  calculateDailyCalorieAdjustment,
  calculateRecommendedTargetCalories,
  calculateGoalRecommendation,
};
