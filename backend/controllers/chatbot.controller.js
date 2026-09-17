const User = require('../models/user.model');
const { getNutritionAdvice } = require('../services/openai.service');

// @desc    Hỏi chatbot AI về dinh dưỡng
// @route   POST /api/chatbot/ask
// @access  Private
exports.askChatbot = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.trim() === '') {
      return res.status(400).json({ message: 'Question is required' });
    }

    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      gender: user.gender,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      activity_level: user.activity_level,
      goal: user.goal,
      target_calories: user.target_calories,
    };

    const userPlan = {
      dailyCalories: user.target_calories || 2000,
      macroSplit: {
        protein: user.target_protein_g,
        carbs: user.target_carb_g,
        fat: user.target_fat_g,
      },
    };

    const advice = await getNutritionAdvice(userProfile, userPlan, question);

    res.json({ answer: advice });
  } catch (error) {
    next(error);
  }
};
