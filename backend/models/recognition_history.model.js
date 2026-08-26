const mongoose = require('mongoose');

const recognitionHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    meal_log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealLog',
      default: null,
    },
    source_type: {
      type: String,
      enum: ['image', 'text'],
      required: [true, 'source_type is required'],
    },
    raw_input: {
      type: String,
      required: [true, 'raw_input is required'],
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
      required: [true, 'ai_model is required'],
    },
    raw_response: {
      type: mongoose.Schema.Types.Mixed, // Có thể là String hoặc Object (JSON Gemini trả về)
      required: [true, 'raw_response is required'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'recognition_history',
  }
);

// Indexes defined in database/mongodb-setup.js
recognitionHistorySchema.index({ user_id: 1, created_at: -1 });
recognitionHistorySchema.index({ meal_log_id: 1 });

const RecognitionHistory = mongoose.model('RecognitionHistory', recognitionHistorySchema);

module.exports = RecognitionHistory;
