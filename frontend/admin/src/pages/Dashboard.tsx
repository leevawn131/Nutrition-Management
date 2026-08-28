import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { adminReportService } from '../services/report.service';
import { OverviewKPIs } from '../types/report.types';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UtensilsCrossed,
  BookOpen,
  AlertTriangle,
  Server,
  Sparkles,
  BarChart3,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardKPIs = async () => {
      try {
        const res = await adminReportService.getOverview();
        if (res.success && res.data) {
          setKpis(res.data.kpis);
        }
      } catch (err) {
        console.error('Lỗi khi tải KPI Dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardKPIs();
  }, []);

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: isLoading ? '...' : kpis ? kpis.total_users.toString() : '0',
      subtitle: 'Tài khoản người dùng hệ thống',
      icon: Users,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      path: '/users',
    },
    {
      title: 'Tổng món ăn',
      value: isLoading ? '...' : kpis ? kpis.total_foods.toString() : '0',
      subtitle: 'Cơ sở dữ liệu thực phẩm & calo',
      icon: UtensilsCrossed,
      color: '#10B981',
      bgColor: '#ECFDF5',
      path: '/foods',
    },
    {
      title: 'Công thức & Thực đơn',
      value: isLoading
        ? '...'
        : kpis
        ? `${kpis.total_recipes}`
        : '0',
      subtitle: kpis
        ? `${kpis.total_meal_plan_templates} thực đơn mẫu`
        : 'Công thức & Thực đơn mẫu',
      icon: BookOpen,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      path: '/meal-plans',
    },
    {
      title: 'Chờ kiểm duyệt',
      value: isLoading
        ? '...'
        : kpis
        ? `${kpis.pending_recipes + kpis.pending_unidentified_foods}`
        : '0',
      subtitle: kpis
        ? `${kpis.pending_recipes} công thức • ${kpis.pending_unidentified_foods} món lạ`
        : 'Yêu cầu chờ Admin xử lý',
      icon: AlertTriangle,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      path: '/reports',
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
            <div
              key={index}
              className="stat-card"
              onClick={() => navigate(card.path)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
              <div className="stat-card-header">
                <div
                  className="stat-icon-wrapper"
                  style={{ backgroundColor: card.bgColor, color: card.color }}>
                  <Icon size={22} />
                </div>
                <span
                  className="stat-badge"
                  style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                  Realtime
                </span>
              </div>
              <div className="stat-card-body">
                <h3 className="stat-value">
                  {isLoading ? <Loader2 size={20} className="spinner" /> : card.value}
                </h3>
                <p className="stat-title">{card.title}</p>
                <span className="stat-subtitle">{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. QUICK BANNER TO DETAILED REPORTS */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#ECFDF5',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Báo cáo & Thống kê Phân tích Đa chiều
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Xem biểu đồ xu hướng tăng trưởng người dùng, phân loại mục tiêu sức khỏe và thống kê dinh dưỡng.
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate('/reports')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>Xem báo cáo chi tiết</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 4. SYSTEM INFO & MODULES STATUS */}
      <div className="dashboard-grid-2" style={{ marginTop: '20px' }}>
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

              <div className="module-item module-completed">
                <div className="module-info">
                  <span className="module-name">Quản lý Người dùng (User Management)</span>
                  <span className="module-desc">Xem danh sách, tìm kiếm, phân quyền tài khoản</span>
                </div>
                <span className="module-status-badge badge-success">Hoàn thành</span>
              </div>

              <div className="module-item module-completed">
                <div className="module-info">
                  <span className="module-name">Quản lý Món ăn & Dinh dưỡng (Food Database)</span>
                  <span className="module-desc">CRUD danh mục thực phẩm, calo, macro, kiểm tra ràng buộc</span>
                </div>
                <span className="module-status-badge badge-success">Hoàn thành</span>
              </div>

              <div className="module-item module-completed">
                <div className="module-info">
                  <span className="module-name">Kế hoạch mẫu & Thực đơn (Meal Plans & Recipes)</span>
                  <span className="module-desc">Quản trị công thức, kiểm duyệt cộng đồng, tạo gói thực đơn</span>
                </div>
                <span className="module-status-badge badge-success">Hoàn thành</span>
              </div>

              <div className="module-item module-completed">
                <div className="module-info">
                  <span className="module-name">Báo cáo & Thống kê (Reports & Analytics)</span>
                  <span className="module-desc">Biểu đồ tăng trưởng, cơ cấu người dùng và vận hành</span>
                </div>
                <span className="module-status-badge badge-success">Hoàn thành</span>
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
                💡 <strong>Gợi ý:</strong> Số liệu thống kê được cập nhật theo thời gian thực từ cơ sở dữ liệu MongoDB thông qua các truy vấn Aggregation bảo toàn tính riêng tư.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
