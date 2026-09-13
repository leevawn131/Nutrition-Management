const User = require('../models/user.model');
const Achievement = require('../models/achievement.model');
const PointLog = require('../models/point_log.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const { getRank, RANK_THRESHOLDS } = require('../utils/rank.utils');

/**
 * Tính rank từ điểm
 */
function getRankFromPoints(points) {
  return getRank(points);
}

/**
 * Cộng điểm cho người dùng, cập nhật rank và kiểm tra thành tựu
 */
async function awardPoints(userId, points, reason) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.points = (user.points || 0) + points;
  user.rank = getRankFromPoints(user.points);
  await user.save();

  // Ghi log điểm
  await PointLog.create({ userId, points, reason });

  // Kiểm tra thành tựu
  await checkAchievements(userId);

  return user;
}

/**
 * Kiểm tra và mở khóa thành tựu cho user
 */
async function checkAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const allAchievements = await Achievement.find();
  const unlockedIds = (user.achievements || []).map((a) => a.toString());
  const newUnlocks = [];

  for (const achievement of allAchievements) {
    const condition = achievement.condition;
    let achieved = false;

    switch (condition.type) {
      case 'points':
        achieved = (user.points || 0) >= condition.threshold;
        break;
      case 'posts': {
        const postCount = await Post.countDocuments({
          $or: [{ author: userId }, { user_id: userId }],
        });
        achieved = postCount >= condition.threshold;
        break;
      }
      case 'comments': {
        const commentCount = await Comment.countDocuments({ author: userId });
        achieved = commentCount >= condition.threshold;
        break;
      }
      case 'likes_received': {
        const result = await Post.aggregate([
          { $match: { $or: [{ author: user._id }, { user_id: user._id }] } },
          { $project: { likeCount: { $size: { $ifNull: ['$likes', []] } } } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } },
        ]);
        const totalLikes = result.length > 0 ? result[0].total : 0;
        achieved = totalLikes >= condition.threshold;
        break;
      }
      case 'streak': {
        const currentStreak =
          typeof user.streak === 'number'
            ? user.streak
            : user.streak?.current_streak || 0;
        achieved = currentStreak >= condition.threshold;
        break;
      }
      case 'friends': {
        achieved = (user.friends || []).length >= condition.threshold;
        break;
      }
      default:
        achieved = false;
    }

    if (achieved && !unlockedIds.includes(achievement._id.toString())) {
      user.achievements = user.achievements || [];
      user.achievements.push(achievement._id);
      newUnlocks.push(achievement);
    }
  }

  if (newUnlocks.length > 0) {
    await user.save();
    console.log(`User ${user.full_name || user.email} unlocked new achievements:`, newUnlocks.map((a) => a.name));
  }
}

/**
 * Cập nhật streak dựa trên hoạt động hàng ngày
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
    user.streak = streakVal;
  }

  user.lastActiveDate = new Date();
  await user.save();

  if (streakVal >= 3) {
    await awardPoints(userId, 5, 'streak_bonus');
  }

  await checkAchievements(userId);
}

module.exports = {
  awardPoints,
  checkAchievements,
  updateStreak,
  getRankFromPoints,
  RANK_THRESHOLDS,
};
