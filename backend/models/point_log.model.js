const mongoose = require('mongoose');

const pointLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'point_logs',
  }
);

pointLogSchema.index({ userId: 1, created_at: -1 });

module.exports = mongoose.model('PointLog', pointLogSchema);
