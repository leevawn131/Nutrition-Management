const User = require('../models/User');
const { getNutritionAdvice } = require('../services/openaiService');

// @desc    Hỏi chatbot AI về dinh dưỡng
// @route   POST /api/chatbot/ask
// @access  Private
exports.askChatbot = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.trim() === '') {
      return res.status(400).json({ message: 'Question is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const advice = await getNutritionAdvice(user.profile, user.plan, question);

    res.json({ answer: advice });
  } catch (error) {
    next(error);
  }
};