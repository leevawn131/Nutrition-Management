import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import {
  User,
  Lock,
  Server,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Save,
  Sliders,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout, updateUser } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');

  // Tab 1: Profile Form State
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Tab 2: Security & Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Tab 3: Local UI Preferences (LocalStorage only)
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('admin_compact_mode') === 'true';
  });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    return localStorage.getItem('admin_auto_refresh') !== 'false';
  });

  // Sync profile form with current user from AuthContext
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setGender((user.gender as any) || '');
      if (user.date_of_birth) {
        // Format ISO date to YYYY-MM-DD for date input
        const d = new Date(user.date_of_birth);
        if (!isNaN(d.getTime())) {
          setDateOfBirth(d.toISOString().split('T')[0]);
        } else {
          setDateOfBirth('');
        }
      } else {
        setDateOfBirth('');
      }
    }
  }, [user]);

  // Handle Tab 1: Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    setIsSavingProfile(true);

    try {
      const payload = {
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        gender: gender ? (gender as 'male' | 'female' | 'other') : null,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      };

      const res = await profileService.updateProfile(payload);

      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setProfileSuccessMsg('Cập nhật hồ sơ quản trị thành công!');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(res.message || 'Cập nhật hồ sơ thất bại.');
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      setProfileErrorMsg(err.response?.data?.message || 'Lỗi hệ thống khi cập nhật hồ sơ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Tab 2: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    // Client-side validations
    if (!currentPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPasswordSuccessMsg('Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      } else {
        setPasswordErrorMsg(res.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err: any) {
      console.error('Lỗi đổi mật khẩu:', err);
      setPasswordErrorMsg(err.response?.data?.message || 'Lỗi hệ thống khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle UI Preferences (LocalStorage Only)
  const handleToggleCompact = (val: boolean) => {
    setCompactMode(val);
    localStorage.setItem('admin_compact_mode', val ? 'true' : 'false');
  };

  const handleToggleAutoRefresh = (val: boolean) => {
    setAutoRefresh(val);
    localStorage.setItem('admin_auto_refresh', val ? 'true' : 'false');
  };

  return (
    <div className="users-page">
      {/* 1. Header & Navigation Tabs */}
      <div className="page-header-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-heading">Cài đặt Hệ thống & Tài khoản Quản trị</h1>
          <p className="page-subheading">
            Quản lý thông tin cá nhân, bảo mật tài khoản Admin và kiểm tra thông số môi trường hệ thống.
          </p>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeTab === 'profile' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'profile' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'profile' ? '#10B981' : '#E2E8F0',
                transition: 'all 0.2s ease',
              }}>
              <User size={16} />
              <span>Hồ sơ Quản trị</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeTab === 'security' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'security' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'security' ? '#10B981' : '#E2E8F0',
                transition: 'all 0.2s ease',
              }}>
              <Lock size={16} />
              <span>Bảo mật & Đổi mật khẩu</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeTab === 'system' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'system' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'system' ? '#10B981' : '#E2E8F0',
                transition: 'all 0.2s ease',
              }}>
              <Server size={16} />
              <span>Thông số Hệ thống</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================
          TAB 1: HỒ SƠ QUẢN TRỊ (ADMIN PROFILE)
          ================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '800px' }}>
          {profileSuccessMsg && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#065F46',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '16px',
              }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="error-banner" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="content-card">
            <div className="card-header">
              <div className="card-header-title">
                <User size={20} color="#10B981" />
                <h3>Thông tin Cá nhân Quản trị viên</h3>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="card-body">
              {/* Avatar Section with Real-time Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #F1F5F9',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    backgroundColor: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '28px',
                    fontWeight: 700,
                    border: '3px solid #E2E8F0',
                    flexShrink: 0,
                  }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Admin Avatar Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback on image loading error
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{fullName ? fullName.charAt(0).toUpperCase() : 'A'}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px' }}>
                    Đường dẫn Ảnh đại diện (Avatar URL)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                    Nhập URL ảnh trực tuyến hợp lệ để xem trước ảnh đại diện ngay lập tức.
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Họ và tên hiển thị <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email (Read-Only) */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Email Đăng nhập <span style={{ fontSize: '11px', color: '#64748B' }}>(Chỉ đọc)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    className="form-input"
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                    value={user?.email || 'admin@nutrition.app'}
                  />
                </div>

                {/* Role (Read-Only) */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Vai trò Tài khoản <span style={{ fontSize: '11px', color: '#64748B' }}>(Cố định)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '13px',
                        border: '1px solid #A7F3D0',
                      }}>
                      <ShieldCheck size={16} />
                      <span>Quản trị viên Hệ thống (Administrator)</span>
                    </span>
                  </div>
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Giới tính
                  </label>
                  <select
                    className="form-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}>
                    <option value="">-- Chưa chọn --</option>
                    <option value="male">Nam (Male)</option>
                    <option value="female">Nữ (Female)</option>
                    <option value="other">Khác (Other)</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Lưu thông tin hồ sơ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY)
          ================================================================= */}
      {activeTab === 'security' && (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {passwordSuccessMsg && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#065F46',
                fontSize: '14px',
                fontWeight: 600,
              }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          {/* Change Password Form Card */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-header-title">
                <Lock size={20} color="#3B82F6" />
                <h3>Đổi Mật khẩu Quản trị</h3>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Current Password */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Mật khẩu hiện tại <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      required
                      className="form-input"
                      placeholder="Nhập mật khẩu đang sử dụng"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}>
                      {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}>
                      {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Xác nhận mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}>
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirement Note */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12.5px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                <Info size={16} color="#3B82F6" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  Mật khẩu được mã hóa an toàn bằng thuật toán <strong>Bcrypt (Salt Factor 10)</strong> trước khi lưu vào cơ sở dữ liệu. Vui lòng ghi nhớ mật khẩu mới.
                </span>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Cập nhật mật khẩu mới</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Session Termination */}
          <div
            className="content-card"
            style={{ border: '1px solid #FCA5A5', backgroundColor: '#FFFDFD' }}>
            <div className="card-header" style={{ borderBottomColor: '#FEE2E2' }}>
              <div className="card-header-title">
                <LogOut size={20} color="#DC2626" />
                <h3 style={{ color: '#991B1B' }}>Đăng xuất Khỏi Phiên Quản trị</h3>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '13.5px', color: '#7F1D1D', marginBottom: '16px' }}>
                Đăng xuất sẽ xóa token xác thực hiện tại khỏi trình duyệt. Bạn sẽ cần nhập lại thông tin để truy cập Cổng Quản trị.
              </p>
              <button
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}>
                <LogOut size={16} />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 3: THÔNG SỐ HỆ THỐNG (SYSTEM CONFIGURATION)
          ================================================================= */}
      {activeTab === 'system' && (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Real System Environment Parameters */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-header-title">
                <Server size={20} color="#3B82F6" />
                <h3>Thông số Môi trường & Kiến trúc Hệ thống</h3>
              </div>
              <span className="role-tag" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                Online & Synchronized
              </span>
            </div>
            <div className="card-body">
              <div className="system-info-list">
                <div className="info-row">
                  <span className="info-label">API Gateway Backend:</span>
                  <span className="info-value font-mono" style={{ color: '#059669', fontWeight: 600 }}>
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Phiên bản Admin Portal:</span>
                  <span className="info-value font-mono">1.0.0 (Vite 6 + React 19 + TypeScript)</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Cơ sở Dữ liệu (Database):</span>
                  <span className="info-value">MongoDB 8.0 (nutrition_app - 27 collections chuẩn)</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Mô hình Trí tuệ Nhân tạo (AI):</span>
                  <span className="info-value" style={{ color: '#8B5CF6', fontWeight: 600 }}>
                    Google Gemini 1.5 Flash (AI Vision & Nutrition Assistant)
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Cơ chế Bảo mật & Phân quyền:</span>
                  <span className="info-value">JWT Bearer Token + Bcrypt (Cost 10) + RBAC</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Mô hình Monorepo:</span>
                  <span className="info-value">Shared Node.js Backend & Mobile App (Expo) / Admin Web</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Client-side UI Preferences (LocalStorage only) */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-header-title">
                <Sliders size={20} color="#10B981" />
                <h3>Tùy chọn Trình duyệt (Lưu trữ cục bộ - LocalStorage)</h3>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    color: '#334155',
                  }}>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => handleToggleCompact(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                  />
                  <div>
                    <strong>Chế độ hiển thị cô đọng (Compact Table View)</strong>
                    <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>
                      Giảm khoảng cách các dòng bảng dữ liệu để hiển thị nhiều thông tin hơn trên màn hình.
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    color: '#334155',
                  }}>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => handleToggleAutoRefresh(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                  />
                  <div>
                    <strong>Tự động làm mới số liệu Dashboard khi mở tab</strong>
                    <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>
                      Luôn gọi lại API thống kê khi chuyển hướng quay lại bảng điều khiển.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
