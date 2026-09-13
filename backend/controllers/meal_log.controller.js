const mealLogService = require('../services/meal_log.service');
const User = require('../models/user.model');

/**
 * Helper to get active user ID from request or fallback to first user in database
 */
const getEffectiveUserId = async (req) => {
  if (req.user && req.user.id) {
    const userExists = await User.findById(req.user.id).lean();
    if (userExists) {
      return req.user.id;
    }
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * GET /api/meal-logs
 */
const getMealLogs = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const { date, startDate, endDate, meal_type } = req.query;

    const logs = await mealLogService.getMealLogs(userId, {
      date,
      startDate,
      endDate,
      meal_type,
    });

    return res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error in getMealLogs:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách nhật ký ăn uống',
    });
  }
};

/**
 * GET /api/meal-logs/summary
 */
const getDailySummary = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const { date } = req.query;

    const summary = await mealLogService.getDailySummary(userId, date);

    return res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('Error in getDailySummary:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy dữ liệu tổng hợp dinh dưỡng trong ngày',
    });
  }
};

/**
 * GET /api/meal-logs/statistics
 */
const getStatistics = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    const { rangeDays, endDate } = req.query;

    const statistics = await mealLogService.getStatistics(userId, {
      rangeDays,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: { statistics },
    });
  } catch (error) {
    console.error('Error in getStatistics:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy dữ liệu thống kê chu kỳ',
    });
  }
};

/**
 * POST /api/meal-logs
 */
const createMealLog = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy người dùng hợp lệ',
      });
    }

    const log = await mealLogService.createMealLog(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Ghi nhật ký ăn uống thành công',
      data: { log },
    });
  } catch (error) {
    console.error('Error in createMealLog:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi ghi nhật ký ăn uống',
    });
  }
};

/**
 * DELETE /api/meal-logs/:id
 */
const deleteMealLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const deleted = await mealLogService.deleteMealLog(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi nhật ký ăn uống cần xoá',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xoá nhật ký ăn uống thành công',
    });
  } catch (error) {
    console.error('Error in deleteMealLog:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xoá nhật ký ăn uống',
    });
  }
};

module.exports = {
  getMealLogs,
  getDailySummary,
  getStatistics,
  createMealLog,
  deleteMealLog,
};
