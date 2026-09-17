const goalChatbotService = require('../services/goal_chatbot.service');
const User = require('../models/user.model');

exports.converseGoalSetting = async (req, res) => {
  try {
    const { message, history } = req.body;

    // An toàn: Nếu có token thì lấy profile từ DB, không có token thì để trống vẫn chat được
    let userProfile = {};
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      const user = await User.findById(userId).select('gender height_cm weight_kg date_of_birth activity_level');
      if (user) {
        userProfile = {
          gender: user.gender,
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          date_of_birth: user.date_of_birth,
          activity_level: user.activity_level,
        };
      }
    }

    const response = await goalChatbotService.chatGoalSession(
      history || [],
      message || '',
      userProfile
    );

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Lỗi converseGoalSetting:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi chatbot: ' + error.message,
    });
  }
};

exports.applyProposedGoal = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để lưu mục tiêu này.' });
    }

    const { targetCalories, macros, targetWeight, goalType, waterIntakeMl, recommendationSummary } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'nutritionGoal.calories': targetCalories,
          'nutritionGoal.protein': macros?.protein || 0,
          'nutritionGoal.carbs': macros?.carb || 0,
          'nutritionGoal.fat': macros?.fat || 0,
          'nutritionGoal.waterMl': waterIntakeMl || 2000,
          'nutritionGoal.targetWeight': targetWeight,
          'nutritionGoal.goalType': goalType,
          'nutritionGoal.summary': recommendationSummary,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Đã lưu mục tiêu thành công!',
      data: updatedUser?.nutritionGoal,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Không thể áp dụng mục tiêu.' });
  }
};