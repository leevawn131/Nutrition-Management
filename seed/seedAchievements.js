const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Achievement = require('../models/Achievement');

dotenv.config();

const achievements = [
  {
    name: 'Người mới',
    description: 'Đạt 10 điểm đầu tiên',
    icon: '🌟',
    condition: { type: 'points', threshold: 10 }
  },
  {
    name: 'Người đam mê',
    description: 'Đạt 100 điểm',
    icon: '💪',
    condition: { type: 'points', threshold: 100 }
  },
  {
    name: 'Chuyên gia',
    description: 'Đạt 500 điểm',
    icon: '🏆',
    condition: { type: 'points', threshold: 500 }
  },
  {
    name: 'Tác giả đầu tay',
    description: 'Đăng bài viết đầu tiên',
    icon: '📝',
    condition: { type: 'posts', threshold: 1 }
  },
  {
    name: 'Nhà sáng tạo nội dung',
    description: 'Đăng 10 bài viết',
    icon: '✍️',
    condition: { type: 'posts', threshold: 10 }
  },
  {
    name: 'Người bình luận',
    description: 'Viết bình luận đầu tiên',
    icon: '💬',
    condition: { type: 'comments', threshold: 1 }
  },
  {
    name: 'Người giao tiếp',
    description: 'Viết 20 bình luận',
    icon: '🗣️',
    condition: { type: 'comments', threshold: 20 }
  },
  {
    name: 'Người được yêu thích',
    description: 'Nhận 10 lượt thích',
    icon: '❤️',
    condition: { type: 'likes_received', threshold: 10 }
  },
  {
    name: 'Ngôi sao mạng xã hội',
    description: 'Nhận 100 lượt thích',
    icon: '⭐',
    condition: { type: 'likes_received', threshold: 100 }
  },
  {
    name: 'Người kiên trì',
    description: 'Duy trì streak 3 ngày',
    icon: '🔥',
    condition: { type: 'streak', threshold: 3 }
  },
  {
    name: 'Người kỷ luật',
    description: 'Duy trì streak 7 ngày',
    icon: '📅',
    condition: { type: 'streak', threshold: 7 }
  },
  {
    name: 'Người bạn tốt',
    description: 'Kết bạn với 1 người',
    icon: '🤝',
    condition: { type: 'friends', threshold: 1 }
  },
  {
    name: 'Trung tâm kết nối',
    description: 'Kết bạn với 10 người',
    icon: '🌐',
    condition: { type: 'friends', threshold: 10 }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    // Xóa achievements cũ
    await Achievement.deleteMany({});
    console.log('Old achievements removed');

    // Thêm mới
    const created = await Achievement.insertMany(achievements);
    console.log(`${created.length} achievements inserted`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();