const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Achievement = require('../models/achievement.model');
const PointLog = require('../models/point_log.model');
const MealLog = require('../models/meal_log.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Recipe = require('../models/recipe.model');
const Notification = require('../models/notification.model');
const { getRank, RANK_THRESHOLDS } = require('../utils/rank.utils');

/**
 * Danh sách danh hiệu / huy hiệu mặc định với điều kiện rõ ràng
 */
const DEFAULT_ACHIEVEMENTS = [
  {
    name: 'Người mới bắt đầu',
    description: 'Ghi nhận bữa ăn đầu tiên trên the.Meal',
    icon: '🌱',
    tier: 'Đồng',
    category: 'Khám phá',
    condition: { type: 'meal_logs', threshold: 1 },
    reward_points: 20,
  },
  {
    name: 'Người ghi chép',
    description: 'Ghi nhật ký bữa ăn trong 10 ngày',
    icon: '📝',
    tier: 'Đồng',
    category: 'Ghi chép',
    condition: { type: 'distinct_meal_days', threshold: 10 },
    reward_points: 30,
  },
  {
    name: 'Bậc thầy chuỗi',
    description: 'Duy trì chuỗi 7 ngày liên tục',
    icon: '🔥',
    tier: 'Bạc',
    category: 'Thói quen',
    condition: { type: 'streak', threshold: 7 },
    reward_points: 50,
  },
  {
    name: 'Đầu bếp tài năng',
    description: 'Chia sẻ hoặc tạo 3 công thức món ăn',
    icon: '👨‍🍳',
    tier: 'Đồng',
    category: 'Nấu nướng',
    condition: { type: 'recipes', threshold: 3 },
    reward_points: 40,
  },
  {
    name: 'Ngôi sao cộng đồng',
    description: 'Tích luỹ đạt 100 điểm thưởng',
    icon: '⭐',
    tier: 'Vàng',
    category: 'Cộng đồng',
    condition: { type: 'points', threshold: 100 },
    reward_points: 50,
  },
  {
    name: 'Chiến binh kiên trì',
    description: 'Duy trì chuỗi 30 ngày liên tục',
    icon: '👑',
    tier: 'Vàng',
    category: 'Thói quen',
    condition: { type: 'streak', threshold: 30 },
    reward_points: 100,
  },
  {
    name: 'Nhà khám phá — Đồng',
    description: 'Mở khoá 3 danh hiệu bất kỳ',
    icon: '🧭',
    tier: 'Đồng',
    category: 'Khám phá',
    condition: { type: 'unlocked_badges', threshold: 3 },
    reward_points: 50,
  },
];

/**
 * Đảm bảo các thành tựu mặc định có trong database và đồng bộ thông tin mới nhất
 */
async function ensureDefaultAchievements() {
  try {
    for (const item of DEFAULT_ACHIEVEMENTS) {
      await Achievement.findOneAndUpdate(
        { name: item.name },
        {
          name: item.name,
          description: item.description,
          icon: item.icon,
          tier: item.tier,
          category: item.category,
          reward_points: item.reward_points,
          condition: item.condition,
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.warn('Lỗi khởi tạo achievements mặc định:', err.message);
  }
}

/**
 * Tạo mã giới thiệu cố định (6 ký tự) dựa trên userId
 */
function generateReferralCode(userId) {
  if (!userId) return 'THEMEAL';
  const hex = userId.toString();
  const hash = crypto.createHash('md5').update(hex).digest('hex').toUpperCase();
  return hash.substring(0, 6);
}

/**
 * Tính rank từ điểm
 */
function getRankFromPoints(points) {
  return getRank(points);
}

/**
 * Cộng điểm cho người dùng, cập nhật rank và ghi log điểm
 */
async function awardPoints(userId, points, reason) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const oldRank = user.rank || 'Bronze';
  user.points = Math.max(0, (user.points || 0) + points);
  const newRank = getRankFromPoints(user.points);
  user.rank = newRank;
  await user.save();

  // Ghi log điểm
  await PointLog.create({ userId, points, reason });

  // Nếu thăng hạng -> gửi thông báo
  if (newRank !== oldRank) {
    try {
      await Notification.create({
        user_id: user._id,
        type: 'streak',
        title: 'Chúc mừng thăng hạng! 🎉',
        message: `Bạn đã đạt cấp bậc ${newRank} với ${user.points} điểm tích luỹ.`,
        is_read: false,
        created_at: new Date(),
      });
    } catch (e) {
      // Ignore notification error
    }
  }

  // Tự động kiểm tra danh hiệu đủ điều kiện
  await checkAchievements(userId);

  return user;
}

/**
 * Tính toán tiến độ thực tế cho một điều kiện danh hiệu
 */
async function calculateConditionProgress(userId, condition, user) {
  const threshold = condition?.threshold || 1;
  let current = 0;

  switch (condition?.type) {
    case 'meal_logs': {
      current = await MealLog.countDocuments({ user_id: userId });
      break;
    }
    case 'distinct_meal_days': {
      const distinctDays = await MealLog.distinct('logged_at', { user_id: userId });
      const dateSet = new Set(distinctDays.map((d) => new Date(d).toISOString().split('T')[0]));
      current = dateSet.size;
      break;
    }
    case 'streak': {
      const streakVal = typeof user?.streak === 'number' ? user.streak : user?.streak?.current_streak || 0;
      const longestVal = user?.streak?.longest_streak || streakVal;
      current = Math.max(streakVal, longestVal);
      break;
    }
    case 'recipes': {
      current = await Recipe.countDocuments({ created_by_user_id: userId });
      break;
    }
    case 'unlocked_badges': {
      current = (user?.achievements || []).length;
      break;
    }
    case 'points': {
      current = user?.points || 0;
      break;
    }
    case 'posts': {
      current = await Post.countDocuments({
        $or: [{ author: userId }, { user_id: userId }],
      });
      break;
    }
    case 'friends': {
      current = (user?.friends || []).length;
      break;
    }
    default:
      current = 0;
  }

  return { current, threshold, met: current >= threshold };
}

/**
 * Kiểm tra và mở khóa danh hiệu tự động cho user
 */
async function checkAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  await ensureDefaultAchievements();
  const allAchievements = await Achievement.find();
  const unlockedIds = (user.achievements || []).map((a) => a.toString());
  const newUnlocks = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.includes(achievement._id.toString())) {
      continue;
    }

    const { met } = await calculateConditionProgress(userId, achievement.condition, user);

    if (met) {
      user.achievements = user.achievements || [];
      user.achievements.push(achievement._id);
      newUnlocks.push(achievement);
    }
  }

  if (newUnlocks.length > 0) {
    await user.save();
    for (const ach of newUnlocks) {
      try {
        await Notification.create({
          user_id: user._id,
          type: 'achievement',
          title: 'Mở khoá danh hiệu mới! 🏆',
          message: `Chúc mừng bạn đã đạt danh hiệu "${ach.name}"!`,
          is_read: false,
          created_at: new Date(),
        });
      } catch (e) {}
    }
  }
}

/**
 * Nhận / Mở khóa danh hiệu có điều kiện cụ thể (Claim Badge)
 */
async function claimBadge(userId, badgeId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng');

  const achievement = await Achievement.findById(badgeId);
  if (!achievement) throw new Error('Danh hiệu không tồn tại');

  const unlockedIds = (user.achievements || []).map((a) => a.toString());
  if (unlockedIds.includes(achievement._id.toString())) {
    return {
      success: true,
      alreadyUnlocked: true,
      message: `Bạn đã sở hữu danh hiệu "${achievement.name}" rồi!`,
      points: user.points,
    };
  }

  const { current, threshold, met } = await calculateConditionProgress(userId, achievement.condition, user);

  if (!met) {
    throw new Error(
      `Bạn chưa đủ điều kiện nhận danh hiệu "${achievement.name}"! Tiến độ hiện tại: ${current}/${threshold}`
    );
  }

  // Đủ điều kiện: Thêm danh hiệu và cộng điểm thưởng
  user.achievements = user.achievements || [];
  user.achievements.push(achievement._id);
  await user.save();

  const rewardPts = achievement.reward_points || 50;
  await awardPoints(userId, rewardPts, `Mở khoá danh hiệu: ${achievement.name}`);

  try {
    await Notification.create({
      user_id: user._id,
      type: 'achievement',
      title: 'Mở khoá danh hiệu mới! 🏆',
      message: `Chúc mừng bạn đã mở khoá danh hiệu "${achievement.name}" và nhận +${rewardPts} điểm thưởng!`,
      is_read: false,
      created_at: new Date(),
    });
  } catch (e) {}

  const updatedUser = await User.findById(userId).select('points rank').lean();

  return {
    success: true,
    pointsAdded: rewardPts,
    points: updatedUser.points,
    rank: updatedUser.rank,
    badge: {
      id: achievement._id.toString(),
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      tier: achievement.tier,
      category: achievement.category,
      points: rewardPts,
    },
    message: `Chúc mừng! Bạn đã mở khoá thành công danh hiệu "${achievement.name}" và nhận +${rewardPts} điểm thưởng! 🎉`,
  };
}

/**
 * Cập nhật streak dựa trên hoạt động hàng ngày (bữa ăn)
 */
async function updateStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  const todayString = today.toDateString();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;

  if (lastActive === todayString) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();

  let streakVal =
    typeof user.streak === 'number' ? user.streak : user.streak?.current_streak || 0;

  if (lastActive === yesterdayString) {
    streakVal += 1;
  } else {
    streakVal = 1;
  }

  if (typeof user.streak === 'object' && user.streak !== null) {
    user.streak.current_streak = streakVal;
    if (streakVal > (user.streak.longest_streak || 0)) {
      user.streak.longest_streak = streakVal;
    }
    user.streak.last_success_date = new Date();
  } else {
    user.streak = {
      current_streak: streakVal,
      longest_streak: streakVal,
      last_success_date: new Date(),
    };
  }

  user.lastActiveDate = new Date();
  await user.save();

  // Thưởng điểm mốc streak
  if (streakVal === 7) {
    await awardPoints(userId, 50, 'Mốc streak 7 ngày');
  } else if (streakVal === 30) {
    await awardPoints(userId, 100, 'Mốc streak 30 ngày');
  } else if (streakVal >= 3) {
    await awardPoints(userId, 5, 'Duy trì streak hàng ngày');
  }

  await checkAchievements(userId);
}

/**
 * Lấy toàn bộ tổng quan Gamification cho màn hình "Hành trình của bạn"
 * (Tập trung 100% vào Dinh Dưỡng, Bữa ăn, Thói quen - Đã bỏ Bước chân và Giấc ngủ)
 */
async function getGamificationOverview(userId) {
  const user = await User.findById(userId).populate('achievements').lean();
  if (!user) throw new Error('User not found');

  await ensureDefaultAchievements();
  const allAchievements = await Achievement.find().lean();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Kiểm tra bữa ăn hôm nay
  const todayMealsCount = await MealLog.countDocuments({
    user_id: userId,
    $or: [
      { logged_at: { $gte: startOfDay, $lte: endOfDay } },
      { created_at: { $gte: startOfDay, $lte: endOfDay } },
    ],
  });

  // 2. Kiểm tra công thức tạo hôm nay
  const todayRecipeCount = await Recipe.countDocuments({
    created_by_user_id: userId,
    created_at: { $gte: startOfDay, $lte: endOfDay },
  });

  // 3. Kiểm tra điểm danh hôm nay
  const checkinLog = await PointLog.findOne({
    userId,
    reason: { $regex: /daily_checkin|điểm danh/i },
    created_at: { $gte: startOfDay, $lte: endOfDay },
  });
  const hasCheckedInToday = Boolean(checkinLog);

  // 4. Kiểm tra các nhiệm vụ đã nhận thưởng hôm nay
  const claimedLogs = await PointLog.find({
    userId,
    created_at: { $gte: startOfDay, $lte: endOfDay },
  }).lean();
  const claimedReasons = new Set(claimedLogs.map((l) => l.reason));

  // Danh sách nhiệm vụ ngày (chỉ tập trung dinh dưỡng / thói quen, KHÔNG có bước đi / giấc ngủ)
  const dailyMissions = [
    {
      id: 'checkin',
      title: 'Điểm danh hôm nay',
      current: hasCheckedInToday ? 1 : 0,
      target: 1,
      unit: 'lần',
      reward: 5,
      completed: hasCheckedInToday,
      claimed: hasCheckedInToday,
      icon: 'calendar-outline',
      iconBg: '#DCFCE7',
      type: 'checkin',
    },
    {
      id: 'meals',
      title: 'Ghi đủ 3 bữa hôm nay',
      current: Math.min(3, todayMealsCount),
      target: 3,
      unit: 'bữa',
      reward: 10,
      completed: todayMealsCount >= 3,
      claimed: claimedReasons.has(`mission_meals_${todayStr}`),
      icon: 'restaurant-outline',
      iconBg: '#FEF3C7',
      type: 'action',
    },
    {
      id: 'weight',
      title: 'Cập nhật cân nặng',
      current: user.weight_kg ? 1 : 0,
      target: 1,
      unit: 'lần',
      reward: 10,
      completed: Boolean(user.weight_kg),
      claimed: claimedReasons.has(`mission_weight_${todayStr}`),
      icon: 'speedometer-outline',
      iconBg: '#EFF6FF',
      type: 'action',
    },
    {
      id: 'recipe',
      title: 'Chia sẻ 1 công thức món ăn',
      current: Math.min(1, todayRecipeCount),
      target: 1,
      unit: 'món',
      reward: 10,
      completed: todayRecipeCount >= 1,
      claimed: claimedReasons.has(`mission_recipe_${todayStr}`),
      icon: 'book-outline',
      iconBg: '#F3E8FF',
      type: 'action',
    },
  ];

  const formattedMissions = dailyMissions.map((m) => ({
    id: m.id,
    title: m.title,
    icon: m.icon,
    iconBg: m.iconBg,
    current: m.current,
    target: m.target,
    unit: m.unit,
    points: m.reward,
    completed: m.completed,
    claimed: m.claimed,
    type: m.type,
  }));

  // 5. Tính toán danh sách Huy hiệu chuẩn theo điều kiện
  const userUnlockedIds = new Set((user.achievements || []).map((a) => (a._id || a).toString()));

  const formattedBadges = [];
  for (const ach of allAchievements) {
    const isUnlocked = userUnlockedIds.has(ach._id.toString());
    const { current, threshold } = await calculateConditionProgress(userId, ach.condition, user);

    let progressText = '';
    if (isUnlocked) {
      progressText = 'Đã hoàn thành mở khoá';
    } else if (current >= threshold) {
      progressText = 'Đủ điều kiện nhận! Nhấn để nhận danh hiệu 🎉';
    } else {
      const remaining = threshold - current;
      if (ach.condition?.type === 'distinct_meal_days') {
        progressText = `${current}/${threshold} · còn ${remaining} ngày có ghi bữa`;
      } else if (ach.condition?.type === 'meal_logs') {
        progressText = `${current}/${threshold} · còn ${remaining} bữa ăn`;
      } else if (ach.condition?.type === 'streak') {
        progressText = `${current}/${threshold} · còn ${remaining} ngày liên tục`;
      } else if (ach.condition?.type === 'recipes') {
        progressText = `${current}/${threshold} · còn ${remaining} công thức`;
      } else if (ach.condition?.type === 'unlocked_badges') {
        progressText = `${current}/${threshold} · còn ${remaining} danh hiệu để mở`;
      } else if (ach.condition?.type === 'points') {
        progressText = `${current}/${threshold} · còn ${remaining} điểm nữa`;
      } else {
        progressText = `${current}/${threshold} · còn ${remaining} mục để mở`;
      }
    }

    formattedBadges.push({
      id: ach._id.toString(),
      name: ach.name,
      description: ach.description,
      icon: ach.icon || '🏆',
      tier: ach.tier || 'Đồng',
      category: ach.category || 'Khám phá',
      points: ach.reward_points || 50,
      progress: Math.min(threshold, current),
      maxProgress: threshold,
      progressText,
      unlocked: isUnlocked,
      canClaim: !isUnlocked && current >= threshold,
    });
  }

  // 6. Tính toán lịch chuỗi 30 ngày trong tháng hiện tại (dựa trên ghi nhận bữa ăn)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthLogs = await MealLog.find({
    user_id: userId,
    logged_at: { $gte: monthStart, $lte: monthEnd },
  })
    .select('logged_at')
    .lean();

  const activeDaysSet = new Set(monthLogs.map((l) => new Date(l.logged_at).getDate()));
  if (hasCheckedInToday) {
    activeDaysSet.add(currentDay);
  }

  const streakVal = typeof user.streak === 'number' ? user.streak : user.streak?.current_streak || 0;

  const streakCalendar = [];
  for (let d = 1; d <= daysInMonth; d++) {
    let status = 'future';
    const isToday = d === currentDay;
    const hasMeal = activeDaysSet.has(d);

    if (d === currentDay) {
      status = hasMeal ? 'completed' : 'today';
    } else if (d < currentDay) {
      if (hasMeal) {
        status = 'completed';
      } else if (d === currentDay - 1 && streakVal > 1) {
        status = 'freeze';
      } else {
        status = 'missed';
      }
    } else {
      status = 'future';
    }

    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    streakCalendar.push({
      day: d,
      dateString: `${now.getFullYear()}-${monthStr}-${dayStr}`,
      status,
      isToday,
      hasMeal,
    });
  }

  // 7. Mốc tiếp theo
  let nextMilestone = 7;
  if (streakVal >= 30) nextMilestone = 100;
  else if (streakVal >= 7) nextMilestone = 30;
  const daysLeft = Math.max(0, nextMilestone - streakVal);

  return {
    points: user.points || 0,
    rank: user.rank || 'Bronze',
    current_streak: streakVal,
    longest_streak: user.streak?.longest_streak || streakVal,
    freezes: 2,
    referral_code: generateReferralCode(user._id),
    missions: formattedMissions,
    badges: formattedBadges,
    streakCalendar,
    nextMilestone: {
      target: nextMilestone,
      daysLeft,
    },
    userBadgeCount: user.achievements?.length || 0,
  };
}

/**
 * Điểm danh hàng ngày (+5 điểm)
 */
async function dailyCheckIn(userId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const existing = await PointLog.findOne({
    userId,
    reason: { $regex: /daily_checkin|điểm danh/i },
    created_at: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existing) {
    throw new Error('Bạn đã điểm danh hôm nay rồi!');
  }

  await awardPoints(userId, 5, 'daily_checkin');
  await updateStreak(userId);

  const updatedUser = await User.findById(userId).select('points rank streak').lean();
  return {
    success: true,
    pointsAdded: 5,
    points: updatedUser.points,
    rank: updatedUser.rank,
    streak: updatedUser.streak?.current_streak || 1,
    message: 'Điểm danh thành công! Bạn nhận được +5 điểm ⭐',
  };
}

/**
 * Nhận thưởng hoàn thành nhiệm vụ ngày (kiểm tra điều kiện thực tế)
 */
async function claimMissionReward(userId, missionId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const reason = `mission_${missionId}_${todayStr}`;

  const existing = await PointLog.findOne({ userId, reason });
  if (existing) {
    throw new Error('Bạn đã nhận thưởng nhiệm vụ này hôm nay rồi!');
  }

  // Kiểm tra điều kiện hoàn thành nhiệm vụ thực tế
  if (missionId === 'meals') {
    const todayMealsCount = await MealLog.countDocuments({
      user_id: userId,
      $or: [
        { logged_at: { $gte: startOfDay, $lte: endOfDay } },
        { created_at: { $gte: startOfDay, $lte: endOfDay } },
      ],
    });
    if (todayMealsCount < 3) {
      throw new Error(
        `Bạn mới ghi được ${todayMealsCount}/3 bữa hôm nay. Hãy ghi đủ 3 bữa để nhận +10 điểm!`
      );
    }
  } else if (missionId === 'weight') {
    if (!user.weight_kg) {
      throw new Error('Vui lòng cập nhật cân nặng trong hồ sơ để hoàn thành nhiệm vụ này!');
    }
  } else if (missionId === 'recipe') {
    const todayRecipeCount = await Recipe.countDocuments({
      created_by_user_id: userId,
      created_at: { $gte: startOfDay, $lte: endOfDay },
    });
    if (todayRecipeCount < 1) {
      throw new Error('Bạn chưa tạo hoặc chia sẻ công thức món ăn nào hôm nay!');
    }
  } else if (missionId === 'checkin') {
    return await dailyCheckIn(userId);
  } else {
    throw new Error('Nhiệm vụ không hợp lệ');
  }

  await awardPoints(userId, 10, reason);
  const updatedUser = await User.findById(userId).select('points').lean();
  return {
    success: true,
    points: updatedUser.points,
    reward: 10,
    message: 'Nhận thưởng nhiệm vụ thành công! +10 điểm 🎉',
  };
}

/**
 * Xử lý nhập mã giới thiệu (+50 điểm cho cả 2 bên)
 */
async function applyReferralCode(userId, code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Mã giới thiệu không hợp lệ');
  }

  const cleanCode = code.trim().toUpperCase();
  const myCode = generateReferralCode(userId);

  if (cleanCode === myCode) {
    throw new Error('Bạn không thể nhập mã giới thiệu của chính mình!');
  }

  const alreadyApplied = await PointLog.findOne({
    userId,
    reason: { $regex: /referral|mã giới thiệu/i },
  });
  if (alreadyApplied) {
    throw new Error('Bạn đã từng nhập mã giới thiệu trước đây rồi!');
  }

  const allUsers = await User.find().select('_id full_name friends').lean();
  const referrer = allUsers.find((u) => generateReferralCode(u._id) === cleanCode);

  if (!referrer) {
    throw new Error('Mã giới thiệu không tồn tại hoặc đã hết hạn!');
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { friends: referrer._id },
  });
  await User.findByIdAndUpdate(referrer._id, {
    $addToSet: { friends: userId },
  });

  await awardPoints(userId, 50, `Nhập mã giới thiệu từ ${referrer.full_name || 'bạn bè'}`);
  await awardPoints(referrer._id, 50, 'Bạn bè nhập mã giới thiệu');

  return {
    success: true,
    referrerName: referrer.full_name || 'Người dùng',
    reward: 50,
    message: 'Nhập mã thành công! Cả hai bạn đều nhận được +50 điểm 🎁',
  };
}

/**
 * Lấy lịch sử giao dịch điểm
 */
async function getPointHistory(userId) {
  const user = await User.findById(userId).select('points').lean();
  const currentPoints = user?.points || 0;

  const logs = await PointLog.find({ userId }).sort({ created_at: -1 }).limit(100).lean();

  return {
    totalPoints: currentPoints,
    logs: logs.map((l) => ({
      id: l._id.toString(),
      points: l.points,
      reason: l.reason,
      created_at: l.created_at,
    })),
  };
}

module.exports = {
  awardPoints,
  checkAchievements,
  claimBadge,
  updateStreak,
  getRankFromPoints,
  getGamificationOverview,
  dailyCheckIn,
  claimMissionReward,
  applyReferralCode,
  getPointHistory,
  generateReferralCode,
  RANK_THRESHOLDS,
};
