import React from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Users,
  UtensilsCrossed,
  CalendarCheck,
  AlertTriangle,
  Server,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: '--',
      subtitle: 'Người dùng trong hệ thống',
      icon: Users,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Tổng món ăn',
      value: '--',
      subtitle: 'Thực phẩm & Dinh dưỡng',
      icon: UtensilsCrossed,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      title: 'Tổng thực đơn',
      value: '--',
      subtitle: 'Kế hoạch dinh dưỡng mẫu',
      icon: CalendarCheck,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: '--',
      subtitle: 'Phản hồi & khiếu nại',
      icon: AlertTriangle,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* 1. WELCOME BANNER */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>
            Xin chào, <span className="highlight-name">{user?.full_name || 'Quản trị viên'}</span>! 👋
          </h2>
          <p>
            Chào mừng bạn đến với Cổng Quản trị <strong>Nutrition Management</strong>. Bảng điều
            khiển giúp bạn quản lý người dùng, dữ liệu dinh dưỡng và theo dõi toàn diện hệ thống.
          </p>
        </div>
        <div className="system-status-pill">
          <span className="status-dot"></span>
          <span>API Backend: <strong>Online</strong></span>
        </div>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div className="stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <div
                  className="stat-icon-wrapper"
                  style={{ backgroundColor: card.bgColor, color: card.color }}>
                  <Icon size={22} />
                </div>
                <span className="stat-badge">Sắp ra mắt</span>
              </div>
              <div className="stat-card-body">
                <h3 className="stat-value">{card.value}</h3>
                <p className="stat-title">{card.title}</p>
                <span className="stat-subtitle">{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SYSTEM INFO & NEXT MODULES */}
      <div className="dashboard-grid-2">
        {/* Module Status Card */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <Sparkles size={20} color="#10B981" />
              <h3>Tiến độ phát triển các phân hệ Admin</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="module-list">
              <div className="module-item module-completed">
                <div className="module-info">
                  <span className="module-name">Admin Web Foundation & Auth Guard</span>
                  <span className="module-desc">Khởi tạo giao diện, xác thực vai trò Admin, bảo vệ tuyến đường</span>
                </div>
                <span className="module-status-badge badge-success">Hoàn thành</span>
              </div>

              <div className="module-item">
                <div className="module-info">
                  <span className="module-name">Quản lý Người dùng (User Management)</span>
                  <span className="module-desc">Xem danh sách, tìm kiếm, phân quyền tài khoản</span>
                </div>
                <span className="module-status-badge badge-pending">Giai đoạn tiếp theo</span>
              </div>

              <div className="module-item">
                <div className="module-info">
                  <span className="module-name">Quản lý Món ăn & Dinh dưỡng (Food Database)</span>
                  <span className="module-desc">CRUD danh mục thực phẩm, calo, macro</span>
                </div>
                <span className="module-status-badge badge-pending">Giai đoạn tiếp theo</span>
              </div>

              <div className="module-item">
                <div className="module-info">
                  <span className="module-name">Kế hoạch mẫu & Thực đơn (Meal Plans)</span>
                  <span className="module-desc">Thiết lập thực đơn mẫu theo mục tiêu tăng/giảm cân</span>
                </div>
                <span className="module-status-badge badge-pending">Giai đoạn tiếp theo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server & Environment Information */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <Server size={20} color="#3B82F6" />
              <h3>Thông tin môi trường hệ thống</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="system-info-list">
              <div className="info-row">
                <span className="info-label">API Endpoint:</span>
                <span className="info-value font-mono">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Tài khoản hiện tại:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Vai trò xác thực:</span>
                <span className="info-value role-tag">{user?.role}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Cấu trúc Monorepo:</span>
                <span className="info-value">Shared Backend & Mobile/Admin</span>
              </div>
            </div>

            <div className="dashboard-tip-box">
              <p>
                💡 <strong>Gợi ý:</strong> Dữ liệu thống kê thực tế sẽ được kết nối tự động khi các API
                thống kê thuộc phân hệ Admin hoàn thiện.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
