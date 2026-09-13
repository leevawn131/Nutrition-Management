const mongoose = require('mongoose');

// Embedded Schema for food_preferences
const foodPreferenceSchema = new mongoose.Schema(
  {
    preference_type: {
      type: String,
      enum: ['diet_type', 'allergy', 'favorite', 'dislike'],
      required: [true, 'preference_type is required'],
    },
    value: {
      type: String,
      required: [true, 'value is required'],
      trim: true,
    },
  },
  { _id: false }
);

// Embedded Schema for streak
const streakSchema = new mongoose.Schema(
  {
    current_streak: {
      type: Number,
      default: 0,
    },
    longest_streak: {
      type: Number,
      default: 0,
    },
    last_success_date: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Authentication fields
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },

    // Profile fields
    full_name: {
      type: String,
      default: null,
      trim: true,
    },
    avatar_url: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', null],
      default: null,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    height_cm: {
      type: Number,
      default: null,
    },
    weight_kg: {
      type: Number,
      default: null,
    },
    activity_level: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', null],
      default: null,
    },
    goal: {
      type: String,
      enum: ['lose', 'maintain', 'gain', null],
      default: null,
    },

    // Nutrition target fields
    target_calories: {
      type: Number,
      default: null,
    },
    target_protein_g: {
      type: Number,
      default: null,
    },
    target_carb_g: {
      type: Number,
      default: null,
    },
    target_fat_g: {
      type: Number,
      default: null,
    },

    // Embedded data
    food_preferences: {
      type: [foodPreferenceSchema],
      default: [],
    },
    streak: {
      type: streakSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users',
  }
);

// Indexes defined in database/mongodb-setup.js
userSchema.index({ role: 1 });

// Exclude password_hash from JSON serialization to prevent leaking sensitive credentials
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
