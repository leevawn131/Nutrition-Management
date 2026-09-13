const mongoose = require('mongoose');

const collectionItemSchema = new mongoose.Schema(
  {
    item_type: {
      type: String,
      enum: ['post', 'recipe'],
      required: [true, 'item_type is required'],
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'item_id is required'],
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userCollectionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    name: {
      type: String,
      required: [true, 'Tên bộ sưu tập không được để trống'],
      trim: true,
    },
    items: {
      type: [collectionItemSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'user_collections',
  }
);

userCollectionSchema.index({ user_id: 1 });

const UserCollection = mongoose.model('UserCollection', userCollectionSchema);

module.exports = UserCollection;
