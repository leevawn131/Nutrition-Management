const mongoose = require('mongoose');

const recognitionHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id là bắt buộc'],
    },
    meal_log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealLog',
      default: null,
    },
    source_type: {
      type: String,
      enum: ['image', 'text', 'manual', 'recipe'],
      default: 'image',
    },
    raw_input: {
      type: String,
      default: '',
    },
    predicted_label: {
      type: String,
      default: null,
    },
    confidence: {
      type: Number,
      default: null,
    },
    corrected_label: {
      type: String,
      default: null,
    },
    ai_model: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    raw_response: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

recognitionHistorySchema.index({ user_id: 1, created_at: -1 });
recognitionHistorySchema.index({ meal_log_id: 1 });

const RecognitionHistory = mongoose.model('RecognitionHistory', recognitionHistorySchema, 'recognition_history');

module.exports = RecognitionHistory;
