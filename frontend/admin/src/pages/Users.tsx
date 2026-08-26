import React, { useState, useEffect, useCallback } from 'react';
import { adminUserService, Pagination } from '../services/user.service';
import { User } from '../types/auth.types';
import { useAuth } from '../auth/AuthContext';
import {
  Search,
  Filter,
  Eye,
  Shield,
  ShieldCheck,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Calendar,
  Flame,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const Users: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminUserService.getUsers({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        role: selectedRole,
      });

      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
      setErrorMessage(
        error.response?.data?.message || 'Không thể tải danh sách người dùng. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // View User Detail
  const handleOpenDetail = async (userId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await adminUserService.getUserById(userId);
      if (res.success && res.data.user) {
        setSelectedUser(res.data.user);
      }
    } catch (error: any) {
      console.error('Lỗi xem chi tiết người dùng:', error);
      alert(error.response?.data?.message || 'Không thể lấy thông tin chi tiết người dùng.');
      setIsDetailModalOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Open Role Edit Modal
  const handleOpenRoleModal = (user: User) => {
    setRoleModalUser(user);
    setNewRole(user.role === 'admin' ? 'user' : 'admin');
    setRoleModalError(null);
  };

  // Submit Role Change
  const handleRoleSubmit = async () => {
    if (!roleModalUser) return;
    setRoleModalError(null);
    setIsRoleSubmitting(true);

    try {
      const res = await adminUserService.updateUserRole(roleModalUser._id, newRole);

      if (res.success) {
        setSuccessToast(res.message || `Đã cập nhật vai trò thành công.`);
        setTimeout(() => setSuccessToast(null), 3000);

        // Update in list
        setUsers((prev) =>
          prev.map((u) => (u._id === roleModalUser._id ? { ...u, role: newRole } : u))
        );

        // If detail modal is also open for this user, update it
        if (selectedUser && selectedUser._id === roleModalUser._id) {
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
        }

        setRoleModalUser(null);
      }
    } catch (error: any) {
      setRoleModalError(
        error.response?.data?.message || 'Không thể cập nhật vai trò người dùng.'
      );
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getGoalLabel = (goal?: string | null) => {
    switch (goal) {
      case 'lose':
        return { text: 'Giảm cân', color: '#EF4444', bg: '#FEF2F2' };
      case 'gain':
        return { text: 'Tăng cân', color: '#10B981', bg: '#ECFDF5' };
      case 'maintain':
        return { text: 'Duy trì', color: '#3B82F6', bg: '#EFF6FF' };
      default:
        return { text: 'Chưa đặt', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const getActivityLabel = (activity?: string | null) => {
    switch (activity) {
      case 'sedentary':
        return 'Ít vận động';
      case 'light':
        return 'Vận động nhẹ';
      case 'moderate':
        return 'Vận động vừa';
      case 'active':
        return 'Vận động nhiều';
      case 'very_active':
        return 'Rất năng động';
      default:
        return '--';
    }
  };

  return (
    <div className="users-page">
      {/* Success Toast */}
      {successToast && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. PAGE TITLE & CONTROLS */}
      <div className="page-header-row">
        <div>
          <h2 className="page-heading">Quản lý Người dùng</h2>
          <p className="page-subheading">
            Xem danh sách, tìm kiếm và phân quyền quản trị người dùng trong hệ thống
          </p>
        </div>

        <button onClick={fetchUsers} className="btn-secondary" title="Làm mới">
          <RefreshCw size={16} className={isLoading ? 'btn-spinner' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo email hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm ? (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="role-filter-group">
          <Filter size={17} className="filter-icon" />
          <select
            className="role-select"
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}>
            <option value="all">Tất cả vai trò</option>
            <option value="user">Người dùng (User)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>
      </div>

      {/* 3. TABLE OR LOADING / EMPTY STATE */}
      <div className="table-card">
        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="table-loading">
            <Loader2 size={32} className="spinner" />
            <p>Đang tải dữ liệu người dùng...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="table-empty">
            <UserIcon size={44} color="#94A3B8" />
            <h3>Không tìm thấy người dùng</h3>
            <p>Không có kết quả nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NGƯỜI DÙNG</th>
                  <th>EMAIL</th>
                  <th>VAI TRÒ</th>
                  <th>MỤC TIÊU</th>
                  <th>CALO MỤC TIÊU</th>
                  <th>NGÀY THAM GIA</th>
                  <th className="text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const goalInfo = getGoalLabel(user.goal);
                  const isSelf = currentAdmin?._id === user._id;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-cell-avatar">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name || 'Avatar'} />
                            ) : (
                              <span>{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="user-cell-info">
                            <span className="user-cell-name">
                              {user.full_name || 'Chưa cập nhật tên'}
                              {isSelf ? <span className="self-tag"> (Bạn)</span> : null}
                            </span>
                            <span className="user-cell-id font-mono">{user._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="user-email-cell">{user.email}</td>

                      <td>
                        <span className={`role-pill role-pill-${user.role}`}>
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheck size={13} />
                              <span>Admin</span>
                            </>
                          ) : (
                            <>
                              <UserIcon size={13} />
                              <span>User</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className="goal-tag"
                          style={{ color: goalInfo.color, backgroundColor: goalInfo.bg }}>
                          {goalInfo.text}
                        </span>
                      </td>

                      <td className="font-semibold">
                        {user.target_calories ? `${user.target_calories} kcal` : '--'}
                      </td>

                      <td className="text-muted">{formatDate(user.created_at)}</td>

                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="action-btn action-btn-view"
                            onClick={() => handleOpenDetail(user._id)}
                            title="Xem chi tiết">
                            <Eye size={16} />
                            <span>Chi tiết</span>
                          </button>

                          <button
                            className="action-btn action-btn-role"
                            onClick={() => handleOpenRoleModal(user)}
                            title="Đổi vai trò">
                            <Shield size={16} />
                            <span>Đổi quyền</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. PAGINATION CONTROLS */}
        {!isLoading && users.length > 0 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Hiển thị <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> –{' '}
              <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong
              tổng số <strong>{pagination.total}</strong> người dùng
            </div>

            <div className="pagination-actions">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.page <= 1}>
                <ChevronLeft size={16} />
                <span>Trước</span>
              </button>

              <span className="pagination-pages">
                Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1}
              </span>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.page >= pagination.totalPages}>
                <span>Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================================================
          5. USER DETAIL MODAL
          ========================================================================== */}
      {isDetailModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-detail-card">
            <div className="modal-header">
              <h3>Hồ sơ Chi tiết Người dùng</h3>
              <button className="modal-close-btn" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {isDetailLoading || !selectedUser ? (
                <div className="modal-loading">
                  <Loader2 size={32} className="spinner" />
                  <p>Đang tải chi tiết...</p>
                </div>
              ) : (
                <div className="user-detail-content">
                  {/* Top Profile Summary */}
                  <div className="detail-profile-hero">
                    <div className="detail-avatar">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} alt="Avatar" />
                      ) : (
                        <span>
                          {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="detail-hero-text">
                      <h4>{selectedUser.full_name || 'Chưa cập nhật tên'}</h4>
                      <p className="detail-email">{selectedUser.email}</p>
                      <div className="detail-tags-row">
                        <span className={`role-pill role-pill-${selectedUser.role}`}>
                          {selectedUser.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                        </span>
                        <span className="id-badge font-mono">ID: {selectedUser._id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Metrics Grid */}
                  <div className="detail-section">
                    <h5 className="detail-section-title">
                      <Activity size={16} color="#10B981" />
                      <span>Thông tin thể chất & Nhân trắc học</span>
                    </h5>
                    <div className="detail-grid-3">
                      <div className="detail-box">
                        <span className="box-label">Giới tính:</span>
                        <span className="box-value">
                          {selectedUser.gender === 'male'
                            ? 'Nam'
                            : selectedUser.gender === 'female'
                            ? 'Nữ'
                            : selectedUser.gender === 'other'
                            ? 'Khác'
                            : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Ngày sinh:</span>
                        <span className="box-value">{formatDate(selectedUser.date_of_birth)}</span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Chiều cao:</span>
                        <span className="box-value">
                          {selectedUser.height_cm ? `${selectedUser.height_cm} cm` : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Cân nặng:</span>
                        <span className="box-value">
                          {selectedUser.weight_kg ? `${selectedUser.weight_kg} kg` : '--'}
                        </span>
                      </div>
                      <div className="detail-box col-span-2">
                        <span className="box-label">Mức độ vận động:</span>
                        <span className="box-value">
                          {getActivityLabel(selectedUser.activity_level)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Goals Grid */}
                  <div className="detail-section">
                    <h5 className="detail-section-title">
                      <Flame size={16} color="#EF4444" />
                      <span>Mục tiêu Dinh dưỡng & Năng lượng</span>
                    </h5>
                    <div className="detail-grid-4">
                      <div className="detail-box">
                        <span className="box-label">Mục tiêu:</span>
                        <span className="box-value">
                          {getGoalLabel(selectedUser.goal).text}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Calo mục tiêu:</span>
                        <span className="box-value font-semibold">
                          {selectedUser.target_calories ? `${selectedUser.target_calories} kcal` : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Đạm (Protein):</span>
                        <span className="box-value">
                          {selectedUser.target_protein_g ? `${selectedUser.target_protein_g} g` : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Tinh bột (Carb):</span>
                        <span className="box-value">
                          {selectedUser.target_carb_g ? `${selectedUser.target_carb_g} g` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="detail-timestamps">
                    <Calendar size={14} />
                    <span>
                      Tạo lúc: <strong>{formatDate(selectedUser.created_at)}</strong> | Cập nhật lần
                      cuối: <strong>{formatDate(selectedUser.updated_at)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </button>
              {selectedUser && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenRoleModal(selectedUser);
                  }}>
                  <Shield size={16} />
                  <span>Đổi vai trò</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          6. ROLE EDIT CONFIRMATION MODAL
          ========================================================================== */}
      {roleModalUser && (
        <div className="modal-backdrop">
          <div className="modal-card modal-role-card">
            <div className="modal-header">
              <h3>Thay đổi Vai trò Người dùng</h3>
              <button className="modal-close-btn" onClick={() => setRoleModalUser(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {roleModalError && (
                <div className="modal-error-banner">
                  <AlertCircle size={18} />
                  <span>{roleModalError}</span>
                </div>
              )}

              <div className="role-modal-user-info">
                <p>
                  Bạn đang thao tác phân quyền cho tài khoản:
                </p>
                <div className="user-highlight-card">
                  <strong>{roleModalUser.full_name || 'Chưa có tên'}</strong>
                  <span className="text-muted">{roleModalUser.email}</span>
                  <span className="font-mono text-sm text-muted">ID: {roleModalUser._id}</span>
                </div>
              </div>

              <div className="role-selector-form">
                <label className="form-label">Chọn vai trò mới:</label>
                <div className="role-options-grid">
                  <label
                    className={`role-option-box ${newRole === 'user' ? 'role-option-selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={newRole === 'user'}
                      onChange={() => setNewRole('user')}
                    />
                    <div className="role-option-text">
                      <strong>User (Người dùng thường)</strong>
                      <span>Truy cập các tính năng dinh dưỡng trên ứng dụng Mobile.</span>
                    </div>
                  </label>

                  <label
                    className={`role-option-box ${newRole === 'admin' ? 'role-option-selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newRole === 'admin'}
                      onChange={() => setNewRole('admin')}
                    />
                    <div className="role-option-text">
                      <strong>Admin (Quản trị viên)</strong>
                      <span>Toàn quyền quản trị dữ liệu trên Cổng Admin Web.</span>
                    </div>
                  </label>
                </div>

                {currentAdmin?._id === roleModalUser._id && newRole === 'user' && (
                  <div className="role-warning-banner">
                    ⚠️ <strong>Cảnh báo:</strong> Bạn đang đăng nhập bằng tài khoản này. Hệ thống không
                    cho phép Quản trị viên tự hạ quyền của chính mình.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setRoleModalUser(null)}
                disabled={isRoleSubmitting}>
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleRoleSubmit}
                disabled={
                  isRoleSubmitting ||
                  newRole === roleModalUser.role ||
                  (currentAdmin?._id === roleModalUser._id && newRole === 'user')
                }>
                {isRoleSubmitting ? (
                  <>
                    <Loader2 size={16} className="btn-spinner" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Xác nhận thay đổi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
