const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { updateUserStreak } = require('./middleware/gamificationMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

// Load env
dotenv.config();

// Khởi tạo app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Cập nhật streak cho mọi request có xác thực
app.use('/api', updateUserStreak);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'Nutrition Management API' });
});

// Error handler
app.use(errorMiddleware);

// Kết nối DB và chạy server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });