const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
const mealRoutes = require('./routes/meal.routes');
const recipeRoutes = require('./routes/recipe.routes');
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/recipes', recipeRoutes);

// Global Error Handler để đảm bảo luôn trả về JSON thay vì HTML
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ (Lỗi JSON)' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Ảnh chụp quá nặng (vượt quá 50MB). Vui lòng thử lại với ảnh dung lượng thấp hơn.' });
  }
  console.error('Lỗi Server Nội Bộ:', err);
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
});

// Lắng nghe cổng
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT} (cho phép mọi thiết bị truy cập)`);
});
