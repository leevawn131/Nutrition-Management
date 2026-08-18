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
app.use('/api/auth', authRoutes);

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
