const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Kết nối MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_app';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err.message));


// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('API Quản lý dinh dưỡng đang hoạt động!');
});

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const healthRoutes = require('./routes/health.routes');
const goalRoutes = require('./routes/goal.routes');
const foodRoutes = require('./routes/food.routes');
const mealRoutes = require('./routes/meal.routes');
const recipeRoutes = require('./routes/recipe.routes');
const groceryRoutes = require('./routes/grocery.routes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/grocery', groceryRoutes);


// Lắng nghe cổng (cho phép cả điện thoại kết nối qua IP Wi-Fi)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT} (Sẵn sàng kết nối từ điện thoại)`);
});
