const User = require('../models/User');
const Achievement = require('../models/Achievement');
const PointLog = require('../models/PointLog');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Ngưỡng rank
const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 600,
  Diamond: 1000
};

/**
 * Tính rank từ điểm
 */
function getRankFromPoints(points) {
  if (points >= RANK_THRESHOLDS.Diamond) return 'Diamond';
  if (points >= RANK_THRESHOLDS.Platinum) return 'Platinum';
  if (points >= RANK_THRESHOLDS.Gold) return 'Gold';
  if (points >= RANK_THRESHOLDS.Silver) return 'Silver';
  return 'Bronze';
}

/**
 * Cộng điểm cho người dùng, cập nhật rank và kiểm tra thành tựu
 */
async function awardPoints(userId, points, reason) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.points += points;
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
  const unlockedIds = user.achievements.map(a => a.toString());
  const newUnlocks = [];

  for (const achievement of allAchievements) {
    const condition = achievement.condition;
    let achieved = false;

    switch (condition.type) {
      case 'points':
        achieved = user.points >= condition.threshold;
        break;
      case 'posts': {
        const postCount = await Post.countDocuments({ author: userId });
        achieved = postCount >= condition.threshold;
        break;
      }
      case 'comments': {
        const commentCount = await Comment.countDocuments({ author: userId });
        achieved = commentCount >= condition.threshold;
        break;
      }
      case 'likes_received': {
        // Tổng số like nhận được trên tất cả bài viết
        const result = await Post.aggregate([
          { $match: { author: user._id } },
          { $project: { likeCount: { $size: '$likes' } } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]);
        const totalLikes = result.length > 0 ? result[0].total : 0;
        achieved = totalLikes >= condition.threshold;
        break;
      }
      case 'streak':
        achieved = user.streak >= condition.threshold;
        break;
      case 'friends':
        achieved = user.friends.length >= condition.threshold;
        break;
      default:
        achieved = false;
    }

    if (achieved && !unlockedIds.includes(achievement._id.toString())) {
      user.achievements.push(achievement._id);
      newUnlocks.push(achievement);
    }
  }

  if (newUnlocks.length > 0) {
    await user.save();
    console.log(`User ${user.username} unlocked new achievements:`, newUnlocks.map(a => a.name));
    // Có thể gửi thông báo realtime ở đây
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
    // Đã active hôm nay, không cần cập nhật
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();

  if (lastActive === yesterdayString) {
    // Active liên tiếp
    user.streak += 1;
  } else {
    // Bỏ lỡ ngày, reset streak
    user.streak = 1;
  }

  user.lastActiveDate = new Date();
  await user.save();

  // Thưởng điểm nếu streak >= 3
  if (user.streak >= 3) {
    await awardPoints(userId, 5, 'streak_bonus');
  }

  // Kiểm tra thành tựu streak
  await checkAchievements(userId);
}

module.exports = {
  awardPoints,
  checkAchievements,
  updateStreak,
  getRankFromPoints,
  RANK_THRESHOLDS
};