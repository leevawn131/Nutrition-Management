const activityService = require('../services/activity.service');
const User = require('../models/user.model');

const getEffectiveUserId = async (req) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const firstUser = await User.findOne({ role: 'user' }).lean();
  return firstUser ? firstUser._id.toString() : null;
};

/**
 * GET /api/activities
 * Get list of standard activities
 */
const getActivities = async (req, res) => {
  try {
    const { search, category } = req.query;
    const activities = await activityService.getActivities({ search, category });
    return res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    console.error('Error in getActivities:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hoạt động',
    });
  }
};

/**
 * GET /api/activities/logs
 * Get activity logs for a specific date
 */
const getActivityLogs = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = await getEffectiveUserId(req);
    const logs = await activityService.getActivityLogs(userId, date);

    return res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error in getActivityLogs:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy nhật ký hoạt động',
    });
  }
};

/**
 * POST /api/activities/logs
 * Add an activity log
 */
const addActivityLog = async (req, res) => {
  try {
    const userId = await getEffectiveUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy người dùng hợp lệ để lưu hoạt động',
      });
    }

    const { activity_id, custom_activity_name, duration_minutes, calories_burned, logged_at } = req.body;
    const log = await activityService.addActivityLog(userId, {
      activity_id,
      custom_activity_name,
      duration_minutes,
      calories_burned,
      logged_at,
    });

    return res.status(201).json({
      success: true,
      message: 'Lên kế hoạch hoạt động thành công',
      data: { log },
    });
  } catch (error) {
    console.error('Error in addActivityLog:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi lưu hoạt động',
    });
  }
};

/**
 * DELETE /api/activities/logs/:id
 * Remove an activity log
 */
const deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getEffectiveUserId(req);
    const deleted = await activityService.deleteActivityLog(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động cần xoá',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xoá hoạt động thành công',
    });
  } catch (error) {
    console.error('Error in deleteActivityLog:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xoá hoạt động',
    });
  }
};

module.exports = {
  getActivities,
  getActivityLogs,
  addActivityLog,
  deleteActivityLog,
};
