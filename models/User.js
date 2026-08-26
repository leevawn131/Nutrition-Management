const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    fullName: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    profile: {
      age: { type: Number, min: 1, max: 120 },
      gender: { type: String, enum: ['male', 'female', 'other'] },
      height: { type: Number, min: 50, max: 250 }, // cm
      weight: { type: Number, min: 20, max: 300 }, // kg
      goal: {
        type: String,
        enum: ['lose_weight', 'gain_weight', 'maintain', 'build_muscle']
      },
      dietaryPreferences: [{ type: String }], // vegetarian, vegan, gluten-free...
      allergies: [{ type: String }],
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
      }
    },
    plan: {
      dailyCalories: { type: Number, default: 2000 },
      macroSplit: {
        protein: { type: Number, default: 25 }, // phần trăm
        carbs: { type: Number, default: 50 },
        fat: { type: Number, default: 25 }
      }
    },
    points: { type: Number, default: 0 },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  },
  { timestamps: true }
);

// Mã hoá mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);