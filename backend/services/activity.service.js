const Activity = require('../models/activity.model');
const ActivityLog = require('../models/activity_log.model');

const INITIAL_ACTIVITIES = [
  {
    name: 'Chạy bộ (tốc độ trung bình 8 km/h)',
    met_value: 8.3,
    category: 'Tập luyện',
  },
  {
    name: 'Đạp xe đạp (15 - 20 km/h)',
    met_value: 6.8,
    category: 'Thể thao',
  },
  {
    name: 'Tập tạ / Gym kháng lực (cường độ vừa)',
    met_value: 5.0,
    category: 'Tập luyện',
  },
  {
    name: 'Bơi lội tự do (tốc độ vừa)',
    met_value: 7.0,
    category: 'Thể thao',
  },
  {
    name: 'Tập Yoga / Giãn cơ (Stretching)',
    met_value: 2.8,
    category: 'Tinh thần',
  },
  {
    name: 'Cardio / HIIT cường độ cao',
    met_value: 9.0,
    category: 'Tập luyện',
  },
  {
    name: 'Đi bộ nhanh (5 - 6 km/h)',
    met_value: 3.8,
    category: 'Tập luyện',
  },
  {
    name: 'Nhảy dây (tốc độ vừa)',
    met_value: 8.8,
    category: 'Tập luyện',
  },
  {
    name: 'Pilates / Core training',
    met_value: 4.0,
    category: 'Tập luyện',
  },
];

class ActivityService {
  /**
   * Ensure standard activities exist in DB
   */
  async ensureInitialActivities() {
    try {
      const count = await Activity.countDocuments();
      if (count < 5) {
        for (const item of INITIAL_ACTIVITIES) {
          const exists = await Activity.findOne({ name: item.name });
          if (!exists) {
            await Activity.create(item);
          }
        }
      }
    } catch (e) {
      // Ignore background init error
    }
  }

  /**
   * Get all activities
   * @param {Object} queryOptions
   * @returns {Promise<Array>}
   */
  async getActivities({ search = '', category = '' } = {}) {
    await this.ensureInitialActivities();

    const query = {};
    if (category && category !== 'Tất cả') {
      query.category = new RegExp(category.trim(), 'i');
    }
    if (search && search.trim()) {
      query.name = new RegExp(search.trim(), 'i');
    }

    return await Activity.find(query).sort({ category: 1, name: 1 }).lean();
  }

  /**
   * Get activity logs for a user on a specific date (or date range)
   * @param {string} userId
   * @param {string|Date} date
   * @returns {Promise<Array>}
   */
  async getActivityLogs(userId, date) {
    const query = {};
    if (userId) {
      query.user_id = userId;
    }

    if (date) {
      let year, month, day;
      if (typeof date === 'string' && date.includes('-')) {
        const parts = date.split('T')[0].split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const d = new Date(date);
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
      }
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      query.logged_at = { $gte: startOfDay, $lte: endOfDay };
    }

    return await ActivityLog.find(query)
      .populate('activity_id')
      .sort({ logged_at: -1, created_at: -1 })
      .lean();
  }

  /**
   * Add an activity log
   * @param {string} userId
   * @param {Object} logData
   * @returns {Promise<Object>}
   */
  async addActivityLog(userId, { activity_id, custom_activity_name, duration_minutes, calories_burned, logged_at }) {
    if (!duration_minutes || duration_minutes <= 0) {
      throw new Error('duration_minutes must be greater than 0');
    }

    const mongoose = require('mongoose');
    let validActivityId = activity_id;
    if (validActivityId && !mongoose.Types.ObjectId.isValid(validActivityId)) {
      const found = await Activity.findOne({
        $or: [
          { name: new RegExp(custom_activity_name || '', 'i') },
          { category: 'Tập luyện' },
        ],
      }).lean();
      validActivityId = found ? found._id : null;
    }

    let calculatedCalories = calories_burned;
    if (!calculatedCalories) {
      if (validActivityId) {
        const act = await Activity.findById(validActivityId).lean();
        const met = act ? act.met_value : 5.0;
        // Estimate with 65kg default: MET * 65kg * (mins/60)
        calculatedCalories = Math.round(met * 65 * (duration_minutes / 60));
      } else {
        calculatedCalories = Math.round(5.0 * 65 * (duration_minutes / 60));
      }
    }

    let logDateObj;
    if (logged_at && typeof logged_at === 'string' && logged_at.includes('-')) {
      const parts = logged_at.split('T')[0].split('-');
      logDateObj = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0, 0));
    } else if (logged_at) {
      logDateObj = new Date(logged_at);
    } else {
      logDateObj = new Date();
    }

    const newLog = await ActivityLog.create({
      user_id: userId,
      activity_id: validActivityId || null,
      custom_activity_name: custom_activity_name || null,
      duration_minutes: parseInt(duration_minutes, 10),
      calories_burned: Math.round(calculatedCalories),
      logged_at: logDateObj,
    });

    return await ActivityLog.findById(newLog._id).populate('activity_id').lean();
  }

  /**
   * Delete an activity log by ID
   * @param {string} userId
   * @param {string} logId
   * @returns {Promise<boolean>}
   */
  async deleteActivityLog(userId, logId) {
    if (!logId) return false;
    const result = await ActivityLog.findByIdAndDelete(logId);
    return Boolean(result);
  }
}

module.exports = new ActivityService();
