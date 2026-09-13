import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/users', label: 'Người dùng', icon: Users },
  { path: '/foods', label: 'Món ăn & Dinh dưỡng', icon: UtensilsCrossed },
  { path: '/meal-plans', label: 'Kế hoạch mẫu', icon: CalendarCheck },
  { path: '/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
  { path: '/settings', label: 'Cài đặt hệ thống', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const current = NAV_ITEMS.find((item) => item.path === location.pathname);
    return current ? current.label : 'Quản trị hệ thống';
  };

  return (
    <div className="admin-layout">
      {/* 1. SIDEBAR */}
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Activity size={22} color="#FFFFFF" />
          </div>
          <div className="brand-text">
            <h2>Nutrition App</h2>
            <span>Admin Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">QUẢN TRỊ</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }>
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-info">
              <span className="admin-name">{user?.full_name || 'Administrator'}</span>
              <span className="admin-email">{user?.email}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="header-title">{getPageTitle()}</h1>
          </div>

          <div className="header-right">
            <div className="role-badge">
              <ShieldCheck size={16} color="#10B981" />
              <span>Quản trị viên</span>
            </div>

            <div className="header-user">
              <span className="user-greeting">Xin chào, <strong>{user?.full_name || 'Admin'}</strong></span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
