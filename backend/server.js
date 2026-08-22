const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('API Quản lý dinh dưỡng đang hoạt động!');
});

// Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const healthRoutes = require('./routes/health.routes');
const goalRoutes = require('./routes/goal.routes');
const recipeRoutes = require('./routes/recipe.routes');
const foodRoutes = require('./routes/food.routes');
const mealPlanRoutes = require('./routes/meal_plan.routes');
const mealLogRoutes = require('./routes/meal_log.routes');
const activityRoutes = require('./routes/activity.routes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/meal-logs', mealLogRoutes);
app.use('/api/activities', activityRoutes);

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
