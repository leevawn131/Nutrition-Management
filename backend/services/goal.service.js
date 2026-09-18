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
 * Calculate recommended macro targets (Protein, Carb, Fat) based on calories and goal
 * @param {number} targetCalories
 * @param {string} goal - 'lose' | 'maintain' | 'gain'
 * @returns {Object} { targetProteinG, targetCarbG, targetFatG }
 */
const calculateMacroTargets = (targetCalories, goal) => {
  const calories = Math.round(targetCalories);
  let proteinRatio = 0.25;
  let carbRatio = 0.50;
  let fatRatio = 0.25;

  if (goal === 'lose') {
    proteinRatio = 0.30;
    carbRatio = 0.45;
    fatRatio = 0.25;
  } else if (goal === 'gain') {
    proteinRatio = 0.25;
    carbRatio = 0.55;
    fatRatio = 0.20;
  }

  return {
    targetProteinG: Math.round((calories * proteinRatio) / 4),
    targetCarbG: Math.round((calories * carbRatio) / 4),
    targetFatG: Math.round((calories * fatRatio) / 9),
  };
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
    const macros = calculateMacroTargets(tdee, 'maintain');
    return {
      goal: 'maintain',
      currentWeight: current_weight,
      targetWeight: target_weight !== undefined && target_weight !== null ? target_weight : current_weight,
      targetDurationWeeks: target_duration_weeks !== undefined && target_duration_weeks !== null ? target_duration_weeks : null,
      weightChange: 0,
      desiredWeeklyWeightChange: 0,
      dailyCalorieAdjustment: 0,
      recommendedTargetCalories: tdee,
      macros,
    };
  }

  // 3. Handle lose and gain cases
  const weightChange = calculateWeightChange(current_weight, target_weight);
  const desiredWeeklyWeightChange = calculateDesiredWeeklyWeightChange(weightChange, target_duration_weeks);
  const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(desiredWeeklyWeightChange);
  const recommendedTargetCalories = calculateRecommendedTargetCalories(tdee, dailyCalorieAdjustment, goal);
  const macros = calculateMacroTargets(recommendedTargetCalories, goal);

  return {
    goal,
    currentWeight: current_weight,
    targetWeight: target_weight,
    targetDurationWeeks: target_duration_weeks,
    weightChange,
    desiredWeeklyWeightChange,
    dailyCalorieAdjustment,
    recommendedTargetCalories,
    macros,
  };
};

/**
 * Helper to parse date string (YYYY-MM-DD or ISO) into UTC start and end bounds
 */
const parseDateBounds = (dateStr) => {
  let year, month, day;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
  }
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return { start, end };
};

/**
 * Calculate micronutrient breakdown for a day
 */
const calculateMicronutrients = (dayLogs, dayPlans, carbConsumed, proteinConsumed, caloriesConsumed) => {
  let fiber = 0;
  let sodium = 0;
  let calcium = 0;
  let iron = 0;
  let potassium = 0;
  let vitaminC = 0;

  let recipeCount = 0;
  for (const p of dayPlans) {
    if (p.recipe_id && p.recipe_id.nutrition_facts) {
      const nf = p.recipe_id.nutrition_facts;
      if (nf.fiber_g) fiber += nf.fiber_g;
      if (nf.sodium_mg) sodium += nf.sodium_mg;
      if (nf.calcium_mg) calcium += nf.calcium_mg;
      if (nf.iron_mg) iron += nf.iron_mg;
      if (nf.potassium_mg) potassium += nf.potassium_mg;
      if (nf.vitamin_c_mg) vitaminC += nf.vitamin_c_mg;
      recipeCount++;
    }
  }

  if (recipeCount === 0 && caloriesConsumed > 0) {
    fiber = Math.round(carbConsumed * 0.14 * 10) / 10;
    sodium = Math.round(caloriesConsumed * 0.95);
    calcium = Math.round(caloriesConsumed * 0.45);
    iron = Math.round(proteinConsumed * 0.15 * 10) / 10;
    potassium = Math.round((carbConsumed + proteinConsumed) * 1.75);
    vitaminC = Math.round(dayLogs.length * 24);
  } else {
    fiber = Math.round(fiber * 10) / 10;
    sodium = Math.round(sodium);
    calcium = Math.round(calcium);
    iron = Math.round(iron * 10) / 10;
    potassium = Math.round(potassium);
    vitaminC = Math.round(vitaminC * 10) / 10;
  }

  return [
    {
      id: 'fiber',
      name: 'Chất xơ',
      amount: fiber,
      target: 28,
      unit: 'g',
      status: fiber >= 20 ? 'optimal' : 'deficient',
      statusLabel: fiber >= 20 ? 'Đạt chuẩn' : 'Thiếu xơ',
      statusColor: fiber >= 20 ? '#10B981' : '#F59E0B',
      percent: Math.min(150, Math.round((fiber / 28) * 100)),
      comment:
        fiber < 20
          ? 'Nên bổ sung thêm rau củ, yến mạch hoặc trái cây để hỗ trợ tiêu hoá và tăng cảm giác no lâu.'
          : 'Lượng chất xơ đạt chuẩn, rất tốt cho đường ruột và ổn định đường huyết.',
    },
    {
      id: 'sodium',
      name: 'Natri (Muối)',
      amount: sodium,
      target: 2000,
      unit: 'mg',
      status: sodium > 2300 ? 'excessive' : 'optimal',
      statusLabel: sodium > 2300 ? 'Thừa / Cảnh báo' : 'Đạt chuẩn',
      statusColor: sodium > 2300 ? '#EF4444' : '#10B981',
      percent: Math.min(200, Math.round((sodium / 2000) * 100)),
      comment:
        sodium > 2300
          ? 'Natri vượt ngưỡng an toàn do các món mặn, nước chấm hoặc ăn ngoài. Nên uống thêm nước lọc và giảm đồ mặn.'
          : 'Lượng muối trong giới hạn an toàn, tốt cho huyết áp và tránh tích nước.',
    },
    {
      id: 'calcium',
      name: 'Canxi',
      amount: calcium,
      target: 1000,
      unit: 'mg',
      status: calcium >= 700 ? 'optimal' : 'deficient',
      statusLabel: calcium >= 700 ? 'Đạt chuẩn' : 'Thiếu canxi',
      statusColor: calcium >= 700 ? '#10B981' : '#F59E0B',
      percent: Math.min(150, Math.round((calcium / 1000) * 100)),
      comment:
        calcium < 700
          ? 'Bổ sung thêm sữa hạt, sữa chua Hy Lạp, phô mai hoặc rau xanh đậm để bảo vệ xương khớp.'
          : 'Đủ lượng canxi cần thiết cho hệ xương và dẫn truyền thần kinh.',
    },
    {
      id: 'iron',
      name: 'Sắt',
      amount: iron,
      target: 15,
      unit: 'mg',
      status: iron >= 12 ? 'optimal' : 'deficient',
      statusLabel: iron >= 12 ? 'Đạt chuẩn' : 'Thiếu sắt',
      statusColor: iron >= 12 ? '#10B981' : '#F59E0B',
      percent: Math.min(150, Math.round((iron / 15) * 100)),
      comment:
        iron < 12
          ? 'Nên thêm thịt bò nạc, lòng đỏ trứng hoặc đậu đen vào thực đơn để tái tạo hồng cầu.'
          : 'Chỉ số sắt ổn định giúp cơ thể không bị uể oải, mệt mỏi.',
    },
    {
      id: 'potassium',
      name: 'Kali',
      amount: potassium,
      target: 3500,
      unit: 'mg',
      status: potassium >= 2500 ? 'optimal' : 'deficient',
      statusLabel: potassium >= 2500 ? 'Đạt chuẩn' : 'Thiếu kali',
      statusColor: potassium >= 2500 ? '#10B981' : '#F59E0B',
      percent: Math.min(150, Math.round((potassium / 3500) * 100)),
      comment:
        potassium < 2500
          ? 'Ăn thêm chuối, khoai lang nướng hoặc quả bơ để cân bằng điện giải và ngừa chuột rút.'
          : 'Lượng kali dồi dào hỗ trợ cơ bắp hoạt động bền bỉ.',
    },
    {
      id: 'vitamin_c',
      name: 'Vitamin C',
      amount: vitaminC,
      target: 80,
      unit: 'mg',
      status: vitaminC >= 60 ? 'optimal' : 'deficient',
      statusLabel: vitaminC >= 60 ? 'Đạt chuẩn' : 'Thiếu vit C',
      statusColor: vitaminC >= 60 ? '#10B981' : '#F59E0B',
      percent: Math.min(150, Math.round((vitaminC / 80) * 100)),
      comment:
        vitaminC < 60
          ? 'Bổ sung thêm cam, bưởi, kiwi hoặc ớt chuông để tăng cường hệ miễn dịch và chống oxy hóa.'
          : 'Đầy đủ vitamin C giúp tăng sức đề kháng và hấp thu sắt tốt hơn.',
    },
  ];
};

/**
 * Calculate in-depth meal and nutrition analysis for a day
 */
const calculateDayMealAnalysis = (
  dayLogs,
  dayPlans,
  user,
  targetCalories,
  targetMacros,
  caloriesConsumed,
  proteinConsumed,
  carbConsumed,
  fatConsumed,
  micronutrients
) => {
  const mealTypes = [
    { key: 'breakfast', label: 'Bữa sáng', targetPercent: 0.25 },
    { key: 'lunch', label: 'Bữa trưa', targetPercent: 0.35 },
    { key: 'dinner', label: 'Bữa tối', targetPercent: 0.30 },
    { key: 'snack', label: 'Bữa phụ', targetPercent: 0.10 },
  ];

  const mealsComparison = mealTypes.map((mt) => {
    const plannedForType = dayPlans.filter((p) => p.meal_type === mt.key);
    const loggedForType = dayLogs.filter((l) => l.meal_type === mt.key);

    const plannedTitle = plannedForType
      .map(
        (p) =>
          (p.recipe_id && p.recipe_id.title) ||
          (p.food_item_id && p.food_item_id.name) ||
          'Món trong kế hoạch'
      )
      .join(', ');
    const actualDesc = loggedForType
      .map((l) => l.description_text || 'Món đã ghi nhận')
      .join(', ');
    const actualCal = Math.round(
      loggedForType.reduce((sum, l) => sum + (l.calories || 0), 0)
    );
    const targetMealCal = Math.round(targetCalories * mt.targetPercent);

    let status = 'skipped';
    let statusLabel = 'Chưa ăn / Bỏ lỡ';
    let statusColor = '#94A3B8';

    if (loggedForType.length > 0) {
      if (plannedForType.length > 0) {
        if (Math.abs(actualCal - targetMealCal) <= targetMealCal * 0.2) {
          status = 'matched';
          statusLabel = 'Chuẩn kế hoạch';
          statusColor = '#10B981';
        } else {
          status = 'deviated';
          statusLabel = actualCal > targetMealCal ? 'Vượt calo bữa' : 'Thiếu calo bữa';
          statusColor = actualCal > targetMealCal ? '#EF4444' : '#F59E0B';
        }
      } else {
        status = 'extra';
        statusLabel = 'Ăn thêm ngoài lịch';
        statusColor = '#6366F1';
      }
    }

    return {
      mealType: mt.key,
      mealLabel: mt.label,
      targetCalories: targetMealCal,
      plannedDish: plannedTitle || 'Chưa lên kế hoạch',
      actualLoggedDish: actualDesc || 'Chưa ghi nhận',
      actualCalories: actualCal,
      status,
      statusLabel,
      statusColor,
    };
  });

  const plannedCount = dayPlans.length;
  const completedCount = dayPlans.filter((p) => p.is_logged).length;
  const planAdherencePercent =
    plannedCount > 0
      ? Math.round((completedCount / plannedCount) * 100)
      : caloriesConsumed > 0
      ? 80
      : 0;

  // 1. Đã ăn chuẩn hướng chưa (Adherence assessment)
  let planAdherenceTitle = 'Chưa bám sát kế hoạch';
  let planAdherenceColor = '#EF4444';
  let planAdherenceVerdict = '';

  if (
    planAdherencePercent >= 70 &&
    Math.abs(caloriesConsumed - targetCalories) <= targetCalories * 0.15
  ) {
    planAdherenceTitle = 'Ăn rất chuẩn hướng!';
    planAdherenceColor = '#10B981';
    planAdherenceVerdict = `Bạn đã bám sát ${planAdherencePercent}% thực đơn đề ra và tổng năng lượng nạp vào (${caloriesConsumed} kcal) vừa vặn với mục tiêu ${targetCalories} kcal.`;
  } else if (caloriesConsumed > targetCalories * 1.15) {
    planAdherenceTitle = 'Bị lệch hướng do nạp vượt calo';
    planAdherenceColor = '#EF4444';
    planAdherenceVerdict = `Tổng calo thực tế (${caloriesConsumed} kcal) đã vượt ${
      caloriesConsumed - targetCalories
    } kcal so với chỉ tiêu (${targetCalories} kcal). Các bữa ăn phát sinh nhiều năng lượng hơn kế hoạch.`;
  } else if (caloriesConsumed < targetCalories * 0.7 && caloriesConsumed > 0) {
    planAdherenceTitle = 'Ăn thiếu calo so với kế hoạch';
    planAdherenceColor = '#F59E0B';
    planAdherenceVerdict = `Nạp ${caloriesConsumed} kcal, thấp hơn ngưỡng tối thiểu cần thiết (${Math.round(
      targetCalories * 0.7
    )} kcal). Bạn cần nạp đủ chất để cơ thể duy trì trao đổi chất và giữ cơ.`;
  } else if (caloriesConsumed === 0) {
    planAdherenceTitle = 'Chưa có nhật ký ăn uống';
    planAdherenceColor = '#94A3B8';
    planAdherenceVerdict =
      'Ngày này chưa có dữ liệu ghi nhận bữa ăn nào để đối chiếu với kế hoạch.';
  } else {
    planAdherenceTitle = 'Cần điều chỉnh nhẹ';
    planAdherenceColor = '#F59E0B';
    planAdherenceVerdict = `Bạn nạp ${caloriesConsumed} kcal / ${targetCalories} kcal, nhưng một số bữa ăn chưa khớp với các món đã lên thực đơn.`;
  }

  // 2. Đánh giá độ phù hợp của các chất (Nutrients assessment)
  const proteinTarget =
    targetMacros?.protein_g || Math.round((targetCalories * 0.25) / 4);
  const carbTarget =
    targetMacros?.carb_g || Math.round((targetCalories * 0.5) / 4);
  const fatTarget =
    targetMacros?.fat_g || Math.round((targetCalories * 0.25) / 9);

  const proteinRatio = proteinTarget > 0 ? proteinConsumed / proteinTarget : 1;
  const carbRatio = carbTarget > 0 ? carbConsumed / carbTarget : 1;
  const fatRatio = fatTarget > 0 ? fatConsumed / fatTarget : 1;

  const nutrientsAssessment = [
    {
      name: 'Chất đạm (Protein)',
      actual: proteinConsumed,
      target: proteinTarget,
      unit: 'g',
      status:
        proteinRatio >= 0.85 && proteinRatio <= 1.2
          ? 'optimal'
          : proteinRatio < 0.85
          ? 'low'
          : 'high',
      statusLabel:
        proteinRatio >= 0.85 && proteinRatio <= 1.2
          ? 'Đạt chuẩn'
          : proteinRatio < 0.85
          ? 'Thiếu đạm'
          : 'Thừa đạm',
      statusColor:
        proteinRatio >= 0.85 && proteinRatio <= 1.2
          ? '#10B981'
          : proteinRatio < 0.85
          ? '#F59E0B'
          : '#6366F1',
      evaluation:
        proteinRatio < 0.85
          ? `Nạp thiếu ${(proteinTarget - proteinConsumed).toFixed(
              1
            )}g đạm. Đạm rất cần thiết để giữ cơ bắp và giúp no lâu khi ${
              user?.goal === 'lose' ? 'giảm cân' : 'tập luyện'
            }.`
          : 'Lượng đạm rất dồi dào, hỗ trợ tái tạo cơ bắp và đốt mỡ hiệu quả.',
    },
    {
      name: 'Đường bột (Carbs)',
      actual: carbConsumed,
      target: carbTarget,
      unit: 'g',
      status:
        carbRatio >= 0.75 && carbRatio <= 1.15
          ? 'optimal'
          : carbRatio < 0.75
          ? 'low'
          : 'high',
      statusLabel:
        carbRatio >= 0.75 && carbRatio <= 1.15
          ? 'Đạt chuẩn'
          : carbRatio < 0.75
          ? 'Thấp'
          : 'Dư thừa carb',
      statusColor:
        carbRatio >= 0.75 && carbRatio <= 1.15
          ? '#10B981'
          : carbRatio < 0.75
          ? '#F59E0B'
          : '#EF4444',
      evaluation:
        carbRatio > 1.15
          ? `Carb vượt chỉ tiêu ${Math.round(
              carbConsumed - carbTarget
            )}g. Nên ưu tiên carb chuyển hóa chậm (khoai lang, yến mạch, gạo lứt) thay vì đồ ngọt.`
          : 'Mức đường bột duy trì ở mức ổn định cung cấp năng lượng cho cơ thể hoạt động.',
    },
    {
      name: 'Chất béo (Fat)',
      actual: fatConsumed,
      target: fatTarget,
      unit: 'g',
      status:
        fatRatio >= 0.75 && fatRatio <= 1.2
          ? 'optimal'
          : fatRatio < 0.75
          ? 'low'
          : 'high',
      statusLabel:
        fatRatio >= 0.75 && fatRatio <= 1.2
          ? 'Đạt chuẩn'
          : fatRatio < 0.75
          ? 'Thấp'
          : 'Nhiều dầu mỡ',
      statusColor:
        fatRatio >= 0.75 && fatRatio <= 1.2
          ? '#10B981'
          : fatRatio < 0.75
          ? '#F59E0B'
          : '#EF4444',
      evaluation:
        fatRatio > 1.2
          ? 'Chất béo hơi cao, hãy hạn chế các món chiên xào nhiều dầu ăn và mỡ động vật.'
          : 'Chất béo cân bằng, giúp hòa tan các vitamin tan trong dầu (A, D, E, K).',
    },
  ];

  // 3. Cần làm gì để phù hợp với mục tiêu hơn (Actionable Guidance)
  const actionableAdvice = [];

  if (proteinRatio < 0.85) {
    actionableAdvice.push(
      `Bổ sung thêm 100-150g thực phẩm giàu đạm (như ức gà áp chảo, trứng luộc, cá hồi, đậu phụ) vào bữa tiếp theo để bù đủ ${Math.round(
        proteinTarget - proteinConsumed
      )}g đạm còn thiếu.`
    );
  }

  const fiberItem = micronutrients.find((m) => m.id === 'fiber');
  if (fiberItem && fiberItem.status === 'deficient') {
    actionableAdvice.push(
      'Thêm 1 đĩa rau củ luộc (bông cải xanh, rau bina) hoặc 1 quả táo/chuối để bổ sung chất xơ, giúp no lâu và hỗ trợ chuyển hóa.'
    );
  }

  const sodiumItem = micronutrients.find((m) => m.id === 'sodium');
  if (sodiumItem && sodiumItem.status === 'excessive') {
    actionableAdvice.push(
      'Lượng muối hôm nay đang ở mức cao. Hãy uống thêm 500ml nước lọc và hạn chế chấm thêm nước mắm, nước tương ở bữa tiếp theo.'
    );
  }

  if (caloriesConsumed > targetCalories * 1.15) {
    actionableAdvice.push(
      `Calo hôm nay đang vượt mức. Bữa tối hoặc bữa phụ nên chuyển sang ăn nhẹ (như salad không sốt béo, canh rau đậu hũ) và đi bộ nhẹ nhàng 20-30 phút.`
    );
  } else if (caloriesConsumed < targetCalories * 0.7 && caloriesConsumed > 0) {
    actionableAdvice.push(
      `Bạn đang ăn quá ít calo so với mức chuyển hóa cơ bản. Đừng nhịn ăn, hãy nạp thêm 1 phần sữa chua Hy Lạp mix hạt hoặc 1 củ khoai lang để cơ thể không bị suy kiệt.`
    );
  }

  if (actionableAdvice.length === 0) {
    actionableAdvice.push(
      'Thực đơn hôm nay rất hoàn hảo! Hãy duy trì phong độ ăn uống khoa học này và uống đủ 2 lít nước trong ngày.'
    );
  }

  return {
    planAdherence: {
      planAdherencePercent,
      title: planAdherenceTitle,
      color: planAdherenceColor,
      verdict: planAdherenceVerdict,
      mealsComparison,
    },
    nutrientsAssessment,
    actionableAdvice,
  };
};

/**
 * Calculate Diet Quality Score (0 - 100) based on Clinical Nutrition Criteria:
 * 1. Caloric Target Proximity (max 30 pts)
 * 2. Macronutrient Balance: Protein (10 pts), Carb (10 pts), Fat (10 pts) (max 30 pts)
 * 3. Micronutrient Adequacy (Fiber, Sodium, Calcium, Iron, Potassium, Vit C) (max 30 pts: 5 pts each)
 * 4. Meal Plan Consistency / Meal completion (max 10 pts)
 */
const calculateDietQualityScore = ({
  caloriesConsumed,
  targetCalories,
  proteinConsumed,
  proteinTarget,
  carbConsumed,
  carbTarget,
  fatConsumed,
  fatTarget,
  micronutrients = [],
  completedPlannedCount = 0,
  plannedCount = 0,
}) => {
  if (!caloriesConsumed || caloriesConsumed === 0) {
    return {
      score: 0,
      grade: 'N/A',
      gradeColor: '#94A3B8',
      label: 'Chưa có dữ liệu',
      summary: 'Chưa ghi nhận bữa ăn nào trong ngày để chấm điểm chất lượng.',
      breakdown: {
        calorieScore: 0,
        macroScore: 0,
        microScore: 0,
        adherenceScore: 0,
      },
    };
  }

  // 1. Calorie Accuracy (max 30)
  let calorieScore = 30;
  const calRatio = targetCalories > 0 ? caloriesConsumed / targetCalories : 1;
  const calDiff = Math.abs(calRatio - 1);
  if (calDiff <= 0.1) {
    calorieScore = 30;
  } else if (calDiff <= 0.2) {
    calorieScore = 22;
  } else if (calDiff <= 0.35) {
    calorieScore = 14;
  } else {
    calorieScore = Math.max(5, Math.round(30 - calDiff * 35));
  }

  // 2. Macro Balance (max 30 pts: 10 each)
  let macroScore = 0;
  const pRatio = proteinTarget > 0 ? proteinConsumed / proteinTarget : 1;
  if (pRatio >= 0.85 && pRatio <= 1.25) macroScore += 10;
  else if (pRatio >= 0.65) macroScore += 7;
  else macroScore += 4;

  const cRatio = carbTarget > 0 ? carbConsumed / carbTarget : 1;
  if (cRatio >= 0.75 && cRatio <= 1.15) macroScore += 10;
  else if (cRatio >= 0.55 && cRatio <= 1.35) macroScore += 7;
  else macroScore += 3;

  const fRatio = fatTarget > 0 ? fatConsumed / fatTarget : 1;
  if (fRatio >= 0.75 && fRatio <= 1.2) macroScore += 10;
  else if (fRatio >= 0.5 && fRatio <= 1.4) macroScore += 7;
  else macroScore += 3;

  // 3. Micronutrients (max 30 pts: 5 pts per micro)
  let microScore = 0;
  if (micronutrients && micronutrients.length > 0) {
    micronutrients.forEach((m) => {
      if (m.status === 'optimal') microScore += 5;
      else if (m.percent >= 50 && m.status !== 'excessive') microScore += 3;
      else microScore += 1.5;
    });
    microScore = Math.min(30, Math.round(microScore));
  } else {
    microScore = 18;
  }

  // 4. Meal Plan Consistency (max 10 pts)
  let adherenceScore = 10;
  if (plannedCount > 0) {
    adherenceScore = Math.round((completedPlannedCount / plannedCount) * 10);
  } else {
    adherenceScore = 8;
  }

  const totalScore = Math.min(
    100,
    Math.max(10, Math.round(calorieScore + macroScore + microScore + adherenceScore))
  );

  let grade = 'B';
  let gradeColor = '#10B981';
  let label = 'Tốt';
  let summary = 'Chế độ ăn hôm nay cân bằng và bám khá sát mục tiêu.';

  if (totalScore >= 90) {
    grade = 'A+';
    gradeColor = '#059669';
    label = 'Xuất sắc';
    summary = 'Chất lượng dinh dưỡng đỉnh cao! Cân đối tuyệt vời giữa calo, đa lượng và vi chất.';
  } else if (totalScore >= 75) {
    grade = 'A';
    gradeColor = '#10B981';
    label = 'Rất tốt';
    summary = 'Dinh dưỡng trong ngày cân bằng tốt, duy trì phong độ này sẽ đạt mục tiêu rất nhanh.';
  } else if (totalScore >= 60) {
    grade = 'B';
    gradeColor = '#F59E0B';
    label = 'Khá';
    summary = 'Đạt mức ổn định, tuy nhiên cần chú ý thêm về cân bằng chất đạm hoặc chất xơ.';
  } else if (totalScore >= 45) {
    grade = 'C';
    gradeColor = '#EA580C';
    label = 'Cần cải thiện';
    summary = 'Năng lượng hoặc các chất đang bị chênh lệch nhiều so với chỉ tiêu đã đề ra.';
  } else {
    grade = 'D';
    gradeColor = '#EF4444';
    label = 'Chưa đạt';
    summary = 'Bữa ăn bị lệch nhiều so với kế hoạch (quá thừa hoặc quá thiếu năng lượng).';
  }

  return {
    score: totalScore,
    grade,
    gradeColor,
    label,
    summary,
    breakdown: {
      calorieScore,
      macroScore,
      microScore,
      adherenceScore,
    },
  };
};

/**
 * Calculate goal maintenance progress (Adherence Tracking)
 * @param {string} userId
 * @param {Object} options - { rangeDays = 7 }
 */
const calculateGoalAdherence = async (userId, { rangeDays = 7 } = {}) => {
  const User = require('../models/user.model');
  const MealLog = require('../models/meal_log.model');
  const ActivityLog = require('../models/activity_log.model');
  const MealPlan = require('../models/meal_plan.model');
  const MealPlanTemplate = require('../models/meal_plan_template.model');
  require('../models/recipe.model');
  require('../models/food_item.model');

  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  const numDays = Math.min(30, Math.max(3, Number(rangeDays) || 7));
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - numDays + 1);

  const { start: startUTC } = parseDateBounds(start.toISOString().split('T')[0]);
  const { end: endUTC } = parseDateBounds(today.toISOString().split('T')[0]);

  const [logs, activityLogs, plannedMeals, templates] = await Promise.all([
    MealLog.find({ user_id: userId, logged_at: { $gte: startUTC, $lte: endUTC } }).lean(),
    ActivityLog.find({ user_id: userId, logged_at: { $gte: startUTC, $lte: endUTC } }).lean(),
    MealPlan.find({ user_id: userId, plan_date: { $gte: startUTC, $lte: endUTC } })
      .populate('recipe_id')
      .populate('food_item_id')
      .lean(),
    MealPlanTemplate.find().limit(5).lean(),
  ]);

  const targetCalories = user.target_calories || 2000;
  const targetProtein = user.target_protein_g || Math.round((targetCalories * 0.25) / 4);
  const targetCarb = user.target_carb_g || Math.round((targetCalories * 0.5) / 4);
  const targetFat = user.target_fat_g || Math.round((targetCalories * 0.25) / 9);

  const daysData = [];
  let onTrackDaysCount = 0;
  let overTargetCount = 0;
  let underTargetCount = 0;
  let missedPlanCount = 0;

  for (let i = 0; i < numDays; i++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + i);
    const dateStr = currentDay.toISOString().split('T')[0];
    const { start: dStart, end: dEnd } = parseDateBounds(dateStr);

    const dayLogs = logs.filter(
      (l) => new Date(l.logged_at) >= dStart && new Date(l.logged_at) <= dEnd
    );
    const dayActivities = activityLogs.filter(
      (a) => new Date(a.logged_at) >= dStart && new Date(a.logged_at) <= dEnd
    );
    const dayPlans = plannedMeals.filter(
      (p) => new Date(p.plan_date) >= dStart && new Date(p.plan_date) <= dEnd
    );

    const caloriesConsumed = Math.round(dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0));
    const proteinConsumed = Math.round(dayLogs.reduce((sum, l) => sum + (l.protein_g || 0), 0) * 10) / 10;
    const carbConsumed = Math.round(dayLogs.reduce((sum, l) => sum + (l.carb_g || 0), 0) * 10) / 10;
    const fatConsumed = Math.round(dayLogs.reduce((sum, l) => sum + (l.fat_g || 0), 0) * 10) / 10;
    const caloriesBurned = Math.round(dayActivities.reduce((sum, a) => sum + (a.calories_burned || 0), 0));

    const plannedCount = dayPlans.length;
    const completedPlannedCount = dayPlans.filter((p) => p.is_logged).length;
    const planCompletionPercent = plannedCount > 0 ? Math.round((completedPlannedCount / plannedCount) * 100) : 0;

    // Status Determination
    let status = 'on_track';
    let statusLabel = 'Đúng kế hoạch';
    let statusColor = '#10B981';
    let statusMessage = 'Lượng calo và dinh dưỡng phù hợp với mục tiêu đề ra.';
    let isDeviated = false;

    if (caloriesConsumed === 0) {
      if (plannedCount > 0) {
        status = 'missed_plan';
        statusLabel = 'Bỏ lỡ kế hoạch';
        statusColor = '#EF4444';
        statusMessage = `Có ${plannedCount} món trong thực đơn nhưng chưa ghi nhận món nào.`;
        isDeviated = true;
        missedPlanCount++;
      } else {
        status = 'not_logged';
        statusLabel = 'Chưa ghi nhận';
        statusColor = '#94A3B8';
        statusMessage = 'Chưa có nhật ký ăn uống trong ngày này.';
        isDeviated = false;
      }
    } else {
      const calorieRatio = targetCalories > 0 ? caloriesConsumed / targetCalories : 1;
      if (calorieRatio > 1.15) {
        status = 'over_target';
        statusLabel = 'Vượt mục tiêu';
        statusColor = '#EF4444';
        const diff = Math.round(caloriesConsumed - targetCalories);
        statusMessage = `Vượt ${diff} kcal so với kế hoạch (${Math.round((calorieRatio - 1) * 100)}%).`;
        isDeviated = true;
        overTargetCount++;
      } else if (calorieRatio < 0.70) {
        status = 'under_target';
        statusLabel = 'Dưới mục tiêu';
        statusColor = '#F59E0B';
        const diff = Math.round(targetCalories - caloriesConsumed);
        statusMessage = `Nạp thiếu ${diff} kcal so với mục tiêu. Cần ăn đủ chất để duy trì chuyển hoá.`;
        isDeviated = true;
        underTargetCount++;
      } else {
        status = 'on_track';
        statusLabel = 'Đúng kế hoạch';
        statusColor = '#10B981';
        statusMessage = 'Calo và dinh dưỡng duy trì rất tốt trong giới hạn mục tiêu!';
        isDeviated = false;
        onTrackDaysCount++;
      }
    }

    const targetMacros = {
      protein_g: targetProtein,
      carb_g: targetCarb,
      fat_g: targetFat,
    };

    const micronutrients = calculateMicronutrients(
      dayLogs,
      dayPlans,
      carbConsumed,
      proteinConsumed,
      caloriesConsumed
    );

    const mealAnalysis = calculateDayMealAnalysis(
      dayLogs,
      dayPlans,
      user,
      targetCalories,
      targetMacros,
      caloriesConsumed,
      proteinConsumed,
      carbConsumed,
      fatConsumed,
      micronutrients
    );

    const dietQualityScore = calculateDietQualityScore({
      caloriesConsumed,
      targetCalories,
      proteinConsumed,
      proteinTarget: targetProtein,
      carbConsumed,
      carbTarget: targetCarb,
      fatConsumed,
      fatTarget: targetFat,
      micronutrients,
      completedPlannedCount,
      plannedCount,
    });

    daysData.push({
      date: dateStr,
      dayOfWeek: currentDay.toLocaleDateString('vi-VN', { weekday: 'short' }),
      caloriesConsumed,
      targetCalories,
      proteinConsumed,
      carbConsumed,
      fatConsumed,
      caloriesBurned,
      plannedCount,
      completedPlannedCount,
      planCompletionPercent,
      status,
      statusLabel,
      statusColor,
      statusMessage,
      isDeviated,
      micronutrients,
      mealAnalysis,
      dietQualityScore,
    });
  }

  // Calculate consecutive deviated days counting backwards from the most recent logged or evaluated days
  let consecutiveDeviatedDays = 0;
  for (let i = daysData.length - 1; i >= 0; i--) {
    const day = daysData[i];
    if (day.status === 'not_logged') {
      // If today has no log yet, don't break streak if today isn't finished
      if (i === daysData.length - 1) continue;
      break;
    }
    if (day.isDeviated) {
      consecutiveDeviatedDays++;
    } else {
      break;
    }
  }

  // Calculate current on-track streak
  let currentOnTrackStreak = 0;
  for (let i = daysData.length - 1; i >= 0; i--) {
    const day = daysData[i];
    if (day.status === 'not_logged' && i === daysData.length - 1) continue;
    if (day.status === 'on_track') {
      currentOnTrackStreak++;
    } else {
      break;
    }
  }

  // Check if user recently updated their plan/goal (e.g. today or after the most recent log)
  let alreadyAdjustedRecently = false;
  if (user.updated_at) {
    const updatedAtTime = new Date(user.updated_at).getTime();
    if (Date.now() - updatedAtTime < 12 * 60 * 60 * 1000) {
      const latestLogTime = logs.reduce((latest, l) => {
        const t = new Date(l.logged_at).getTime();
        return t > latest ? t : latest;
      }, 0);
      if (updatedAtTime >= latestLogTime) {
        alreadyAdjustedRecently = true;
      }
    }
  }

  const adherenceRate = Math.round((onTrackDaysCount / numDays) * 100);
  const needsAdjustmentConfirmation = consecutiveDeviatedDays >= 3 && !alreadyAdjustedRecently;

  // Generate Suggested Adjusted Plan based on deviation pattern
  let suggestedTargetCalories = targetCalories;
  let adjustmentReason = 'Duy trì kế hoạch hiện tại vì bạn đang tuân thủ rất tốt.';
  let adjustmentType = 'maintain';

  if (overTargetCount >= 2 || (consecutiveDeviatedDays >= 3 && overTargetCount >= underTargetCount && overTargetCount > 0)) {
    if (user.goal === 'lose') {
      // User is struggling with calorie restriction: soften deficit
      suggestedTargetCalories = Math.round(targetCalories + 250);
      adjustmentReason =
        'Bạn có xu hướng nạp vượt mức calo mục tiêu gần đây. Mức thâm hụt hiện tại có thể quá gắt, gây đói nhanh. Chúng tôi gợi ý tăng nhẹ +250 kcal/ngày để ăn uống thoải mái, bền vững hơn.';
      adjustmentType = 'soften_deficit';
    } else if (user.goal === 'gain') {
      suggestedTargetCalories = Math.round(targetCalories + 150);
      adjustmentReason = 'Bạn đang tăng cân tốt, có thể duy trì hoặc tối ưu thêm tỷ lệ đạm.';
      adjustmentType = 'optimize_gain';
    } else {
      suggestedTargetCalories = Math.round(targetCalories + 200);
      adjustmentReason = 'Điều chỉnh mục tiêu calo linh hoạt hơn phù hợp với mức tiêu hao thực tế.';
      adjustmentType = 'adjust_balance';
    }
  } else if (underTargetCount >= 2 || (consecutiveDeviatedDays >= 3 && underTargetCount > overTargetCount)) {
    suggestedTargetCalories = Math.max(1300, Math.round(targetCalories - 100));
    adjustmentReason =
      'Bạn thường nạp ít hơn kế hoạch. Hãy đảm bảo ăn đủ các bữa chính để cơ thể có đủ năng lượng và không bị giảm cơ.';
    adjustmentType = 'stabilize_intake';
  } else if (missedPlanCount >= 2 || consecutiveDeviatedDays >= 3) {
    suggestedTargetCalories = targetCalories;
    adjustmentReason =
      'Bạn có dấu hiệu bỏ lỡ việc theo dõi hoặc chưa thực hiện các món trong kế hoạch. Hãy bắt đầu từ các bữa ăn đơn giản để dần xây dựng thói quen.';
    adjustmentType = 'simplify_plan';
  }

  const suggestedMacros = calculateMacroTargets(suggestedTargetCalories, user.goal || 'maintain');

  const suggestedPlan = {
    suggestedTargetCalories,
    currentCalories: targetCalories,
    macros: suggestedMacros,
    goal: user.goal,
    adjustmentType,
    reason: adjustmentReason,
    templates: templates.map((t) => ({
      _id: t._id,
      name: t.name,
      description: t.description,
      duration_days: t.duration_days,
      image_url: t.image_url,
    })),
  };

  return {
    userId,
    userGoal: user.goal,
    targetCalories,
    targetMacros: {
      protein_g: targetProtein,
      carb_g: targetCarb,
      fat_g: targetFat,
    },
    numDays,
    adherenceRate,
    currentOnTrackStreak,
    consecutiveDeviatedDays,
    needsAdjustmentConfirmation,
    summary: {
      onTrackDaysCount,
      overTargetCount,
      underTargetCount,
      missedPlanCount,
    },
    days: daysData,
    suggestedPlan,
  };
};

/**
 * Apply Goal to User Profile and optionally to Meal Plans
 * @param {string} userId
 * @param {Object} payload
 */
const applyGoalToMealPlan = async (userId, payload) => {
  const User = require('../models/user.model');
  const MealPlan = require('../models/meal_plan.model');
  const MealPlanTemplate = require('../models/meal_plan_template.model');

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  const {
    goal,
    target_calories,
    target_protein_g,
    target_carb_g,
    target_fat_g,
    target_weight,
    template_id,
    start_date,
    days_count = 7,
  } = payload;

  if (goal) user.goal = goal;
  if (target_calories) user.target_calories = Math.round(Number(target_calories));
  if (target_protein_g !== undefined) user.target_protein_g = Number(target_protein_g);
  if (target_carb_g !== undefined) user.target_carb_g = Number(target_carb_g);
  if (target_fat_g !== undefined) user.target_fat_g = Number(target_fat_g);

  await user.save();

  // Meal distribution ratios for plans
  const totalCal = user.target_calories || 2000;
  const mealDistribution = {
    breakfast: { calories: Math.round(totalCal * 0.25), label: 'Bữa sáng (25%)' },
    lunch: { calories: Math.round(totalCal * 0.35), label: 'Bữa trưa (35%)' },
    dinner: { calories: Math.round(totalCal * 0.30), label: 'Bữa tối (30%)' },
    snack: { calories: Math.round(totalCal * 0.10), label: 'Bữa phụ (10%)' },
  };

  let appliedTemplateName = null;
  let createdPlansCount = 0;

  // If a template is selected, apply its items to meal_plans for upcoming days
  if (template_id) {
    const template = await MealPlanTemplate.findById(template_id).lean();
    if (template && Array.isArray(template.items) && template.items.length > 0) {
      appliedTemplateName = template.name;
      const baseDate = start_date ? new Date(start_date) : new Date();

      const newPlanDocs = [];
      for (let dayOffset = 0; dayOffset < days_count; dayOffset++) {
        const planDate = new Date(baseDate);
        planDate.setDate(baseDate.getDate() + dayOffset);
        const { start: pStart } = parseDateBounds(planDate.toISOString().split('T')[0]);

        template.items.forEach((item) => {
          newPlanDocs.push({
            user_id: userId,
            plan_date: pStart,
            meal_type: item.meal_type || 'lunch',
            recipe_id: item.recipe_id || null,
            food_item_id: item.food_item_id || null,
            source: 'template',
            is_logged: false,
            created_at: new Date(),
          });
        });
      }

      if (newPlanDocs.length > 0) {
        await MealPlan.insertMany(newPlanDocs);
        createdPlansCount = newPlanDocs.length;
      }
    }
  }

  return {
    success: true,
    user,
    mealDistribution,
    appliedTemplateName,
    createdPlansCount,
  };
};

/**
 * Confirm user response when over 3 days off-track
 * @param {string} userId
 * @param {Object} param1 - { action: 'accept_suggestion' | 'keep_current', new_target_calories, template_id }
 */
const confirmAdherenceAdjustment = async (userId, { action, new_target_calories, template_id }) => {
  const User = require('../models/user.model');
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'accept_suggestion') {
    if (new_target_calories && !isNaN(Number(new_target_calories))) {
      user.target_calories = Math.round(Number(new_target_calories));
      const macros = calculateMacroTargets(user.target_calories, user.goal || 'maintain');
      user.target_protein_g = macros.targetProteinG;
      user.target_carb_g = macros.targetCarbG;
      user.target_fat_g = macros.targetFatG;
      await user.save();
    }

    if (template_id) {
      await applyGoalToMealPlan(userId, {
        goal: user.goal,
        target_calories: user.target_calories,
        target_protein_g: user.target_protein_g,
        target_carb_g: user.target_carb_g,
        target_fat_g: user.target_fat_g,
        template_id,
        days_count: 7,
      });
    }

    user.updated_at = new Date();
    await user.save();
    return {
      success: true,
      action: 'accepted',
      message: 'Đã cập nhật mục tiêu mới và điều chỉnh kế hoạch dinh dưỡng phù hợp!',
      user,
    };
  }

  user.updated_at = new Date();
  await user.save();

  return {
    success: true,
    action: 'kept',
    message: 'Giữ nguyên kế hoạch hiện tại. Hãy tiếp tục kiên trì nhé!',
    user,
  };
};

/**
 * Generate on-demand Gemini 3.5 Flash meal nutrition analysis for a day
 * @param {string} userId
 * @param {string} targetDateStr - YYYY-MM-DD
 */
const generateAIMealAnalysis = async (userId, targetDateStr) => {
  const geminiService = require('./gemini.service');
  const User = require('../models/user.model');

  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error('Không tìm thấy thông tin người dùng');
    error.statusCode = 404;
    throw error;
  }

  // Get calculated adherence data for context
  const adherence = await calculateGoalAdherence(userId, { rangeDays: 7 });
  const dateToFind = targetDateStr || new Date().toISOString().split('T')[0];

  const matchedDay =
    adherence.days.find((d) => d.date === dateToFind) ||
    adherence.days[adherence.days.length - 1];

  const targetCal = matchedDay ? matchedDay.targetCalories : user.target_calories || 2000;
  const targetProtein = user.target_protein_g || Math.round((targetCal * 0.25) / 4);
  const targetCarb = user.target_carb_g || Math.round((targetCal * 0.5) / 4);
  const targetFat = user.target_fat_g || Math.round((targetCal * 0.25) / 9);

  const payload = {
    userGoal: user.goal || 'lose',
    targetCalories: targetCal,
    date: matchedDay ? matchedDay.date : dateToFind,
    dayOfWeek: matchedDay ? matchedDay.dayOfWeek : 'Hôm nay',
    caloriesConsumed: matchedDay ? matchedDay.caloriesConsumed : 0,
    macros: {
      protein: { actual: matchedDay ? matchedDay.proteinConsumed : 0, target: targetProtein },
      carb: { actual: matchedDay ? matchedDay.carbConsumed : 0, target: targetCarb },
      fat: { actual: matchedDay ? matchedDay.fatConsumed : 0, target: targetFat },
    },
    micronutrients: matchedDay?.micronutrients || [],
    mealsComparison: matchedDay?.mealAnalysis?.planAdherence?.mealsComparison || [],
  };

  const aiResult = await geminiService.generateMealNutritionAdvice(payload);
  return {
    date: payload.date,
    dayOfWeek: payload.dayOfWeek,
    ...aiResult,
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
  calculateMacroTargets,
  calculateGoalRecommendation,
  calculateGoalAdherence,
  applyGoalToMealPlan,
  confirmAdherenceAdjustment,
  generateAIMealAnalysis,
};

