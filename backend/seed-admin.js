const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB thành công!');

    const email = 'admin@nutrition.app';
    const password = 'Admin@123456';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Tài khoản admin đã tồn tại!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await User.create({
      email,
      password_hash,
      role: 'admin',
      full_name: 'Quản trị viên Hệ thống',
    });

    console.log('✅ Đã tạo tài khoản admin thành công!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedAdmin();
