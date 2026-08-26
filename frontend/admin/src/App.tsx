import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Foods } from './pages/Foods';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/foods" element={<Foods />} />
              <Route
                path="/meal-plans"
                element={
                  <PlaceholderPage
                    title="Kế hoạch Dinh dưỡng mẫu"
                    description="Thiết lập các gói thực đơn dinh dưỡng mẫu cho người dùng."
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <PlaceholderPage
                    title="Báo cáo & Thống kê"
                    description="Biểu đồ phân tích lượng người dùng, tần suất ăn uống và tương tác."
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="Cài đặt hệ thống"
                    description="Cấu hình hệ thống, tham số AI và quản lý bảo mật."
                  />
                }
              />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
