import React, { useState, useEffect, useCallback } from 'react';
import { adminAchievementService } from '../services/achievement.service';
import {
  Achievement,
  AchievementConditionType,
  AchievementPagination,
} from '../types/achievement.types';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Trophy,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';

const CONDITION_TYPE_LABELS: Record<
  AchievementConditionType,
  { label: string; color: string; bg: string; unit: string }
> = {
  points: { label: 'Tích lũy Điểm thưởng', color: '#D97706', bg: '#FEF3C7', unit: 'điểm' },
  streak: { label: 'Chuỗi ngày liên tục (Streak)', color: '#DC2626', bg: '#FEE2E2', unit: 'ngày' },
  posts: { label: 'Đăng bài viết', color: '#2563EB', bg: '#EFF6FF', unit: 'bài' },
  comments: { label: 'Bình luận trao đổi', color: '#059669', bg: '#ECFDF5', unit: 'bình luận' },
  likes_received: { label: 'Lượt thích nhận được', color: '#DB2777', bg: '#FCE7F3', unit: 'lượt thích' },
  friends: { label: 'Kết nối bạn bè', color: '#7C3AED', bg: '#F3E8FF', unit: 'bạn bè' },
  meal_logs: { label: 'Ghi nhận bữa ăn', color: '#10B981', bg: '#D1FAE5', unit: 'bữa ăn' },
  distinct_meal_days: { label: 'Số ngày ghi nhận', color: '#06B6D4', bg: '#CFFAFE', unit: 'ngày' },
  recipes: { label: 'Công thức nấu nướng', color: '#F59E0B', bg: '#FEF3C7', unit: 'công thức' },
  unlocked_badges: { label: 'Mở khóa danh hiệu', color: '#8B5CF6', bg: '#EDE9FE', unit: 'danh hiệu' },
  custom: { label: 'Tùy chỉnh khác', color: '#475569', bg: '#F1F5F9', unit: 'lần' },
};

const SUGGESTED_ICONS = ['🏆', '🌟', '💪', '🔥', '📅', '✍️', '💬', '❤️', '⭐', '🤝', '👑', '🎯', '🥗', '⚡'];

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pagination, setPagination] = useState<AchievementPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedConditionType, setSelectedConditionType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    conditionType: 'points' as AchievementConditionType,
    threshold: '10',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAchievements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminAchievementService.getAchievements({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        condition_type: selectedConditionType,
      });

      if (res.success && res.data) {
        setAchievements(res.data.achievements || []);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh hiệu:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedConditionType]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAchievement(null);
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      conditionType: 'points',
      threshold: '10',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ach: Achievement) => {
    setEditingAchievement(ach);
    setFormData({
      name: ach.name,
      description: ach.description,
      icon: ach.icon || '🏆',
      conditionType: ach.condition?.type || 'points',
      threshold: String(ach.condition?.threshold ?? 1),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên danh hiệu');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Vui lòng nhập mô tả hoặc cách đạt được danh hiệu');
      return;
    }

    const thresholdNum = parseInt(formData.threshold, 10);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      setFormError('Ngưỡng điều kiện phải là số nguyên dương >= 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAchievement) {
        await adminAchievementService.updateAchievement(editingAchievement._id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: formData.icon.trim() || '🏆',
          condition: {
            type: formData.conditionType,
            threshold: thresholdNum,
          },
        });
        showToast(`Đã cập nhật danh hiệu "${formData.name.trim()}" thành công!`);
      } else {
        await adminAchievementService.createAchievement({
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: formData.icon.trim() || '🏆',
          condition: {
            type: formData.conditionType,
            threshold: thresholdNum,
          },
        });
        showToast(`Đã tạo danh hiệu mới "${formData.name.trim()}" thành công!`);
      }
      setIsFormModalOpen(false);
      fetchAchievements();
    } catch (err: any) {
      console.error('Lỗi khi lưu danh hiệu:', err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (ach: Achievement) => {
    setAchievementToDelete(ach);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!achievementToDelete) return;
    setIsDeleting(true);
    try {
      await adminAchievementService.deleteAchievement(achievementToDelete._id);
      showToast(`Đã xóa danh hiệu "${achievementToDelete.name}" thành công!`);
      setIsDeleteModalOpen(false);
      setAchievementToDelete(null);
      fetchAchievements();
    } catch (err: any) {
      console.error('Lỗi khi xóa danh hiệu:', err);
      alert(err.response?.data?.message || 'Không thể xóa danh hiệu này.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="users-page">
      {/* Toast thông báo */}
      {successToast && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ TRANG & NÚT TẠO */}
      <div className="page-header-row">
        <div>
          <h2 className="page-heading">Quản lý Danh hiệu & Huy hiệu</h2>
          <p className="page-subheading">
            Cấu hình hệ thống gamification, danh hiệu vinh danh, chuỗi streak và điều kiện mở khóa
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchAchievements} className="btn-secondary" title="Làm mới">
            <RefreshCw size={16} className={isLoading ? 'btn-spinner' : ''} />
            <span>Làm mới</span>
          </button>
          <button onClick={handleOpenCreateModal} className="btn-primary">
            <Plus size={16} />
            <span>Tạo danh hiệu mới</span>
          </button>
        </div>
      </div>

      {/* 2. THỐNG KÊ TỔNG QUAN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}>
            <Trophy size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Tổng số danh hiệu
            </span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              {pagination.total}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}>
            <Flame size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Mục tiêu Streak & Điểm
            </span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              {
                achievements.filter(
                  (a) => a.condition?.type === 'streak' || a.condition?.type === 'points'
                ).length
              }
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}>
            <Sparkles size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Tương tác & Cộng đồng
            </span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              {
                achievements.filter((a) =>
                  ['posts', 'comments', 'likes_received', 'friends'].includes(a.condition?.type)
                ).length
              }
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC & TÌM KIẾM */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo tên danh hiệu hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="role-filter-group">
          <Filter size={17} className="filter-icon" />
          <select
            className="role-select"
            value={selectedConditionType}
            onChange={(e) => {
              setSelectedConditionType(e.target.value);
              setCurrentPage(1);
            }}>
            <option value="all">Tất cả điều kiện</option>
            {Object.entries(CONDITION_TYPE_LABELS).map(([type, info]) => (
              <option key={type} value={type}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. THÔNG BÁO LỖI NẾU CÓ */}
      {errorMessage && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button onClick={fetchAchievements} className="btn-retry">
            Thử lại
          </button>
        </div>
      )}

      {/* 5. BẢNG DANH SÁCH DANH HIỆU */}
      <div className="table-card">
        {isLoading ? (
          <div className="table-loading-container">
            <Loader2 size={32} className="btn-spinner" color="#10B981" />
            <p>Đang tải danh sách huy hiệu & thành tích...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="table-empty-container">
            <Award size={40} color="#94A3B8" />
            <p className="empty-title">Không tìm thấy danh hiệu nào</p>
            <p className="empty-desc">
              {searchTerm || selectedConditionType !== 'all'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc điều kiện.'
                : 'Chưa có danh hiệu nào được tạo. Hãy tạo danh hiệu đầu tiên!'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Biểu tượng</th>
                <th>Tên danh hiệu & Mô tả</th>
                <th>Điều kiện đạt được</th>
                <th style={{ textAlign: 'center' }}>Ngưỡng kích hoạt</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((ach) => {
                const condInfo =
                  CONDITION_TYPE_LABELS[ach.condition?.type as AchievementConditionType] ||
                  CONDITION_TYPE_LABELS.custom;
                return (
                  <tr key={ach._id}>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '46px',
                          height: '46px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                        }}>
                        {ach.icon || '🏆'}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: '14.5px', color: '#0F172A', display: 'block' }}>
                          {ach.name}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                          {ach.description}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: condInfo.bg,
                          color: condInfo.color,
                        }}>
                        {condInfo.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#0F172A',
                          backgroundColor: '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}>
                        {ach.condition?.threshold ?? 1} {condInfo.unit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditModal(ach)}
                          className="action-btn"
                          title="Chỉnh sửa danh hiệu"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                          }}>
                          <Edit2 size={15} color="#475569" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(ach)}
                          className="action-btn"
                          title="Xóa danh hiệu"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                            color: '#EF4444',
                            cursor: 'pointer',
                          }}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 6. PHÂN TRANG */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="pagination-container">
            <span className="pagination-info">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
              <strong>{pagination.total}</strong> danh hiệu
            </span>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={16} />
              </button>
              <span className="pagination-current">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. MODAL THÊM / SỬA DANH HIỆU */}
      {isFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingAchievement ? 'Chỉnh sửa danh hiệu / thành tích' : 'Tạo danh hiệu mới'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="error-alert" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Chọn Icon Emoji */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Biểu tượng (Icon Emoji) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '70px', height: '44px', textAlign: 'center', fontSize: '24px' }}
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      maxLength={4}
                    />
                    <span style={{ fontSize: '13px', color: '#64748B' }}>
                      Nhập emoji hoặc chọn nhanh từ danh sách bên dưới:
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {SUGGESTED_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: ic })}
                        style={{
                          fontSize: '18px',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: formData.icon === ic ? '2px solid #10B981' : '1px solid #E2E8F0',
                          backgroundColor: formData.icon === ic ? '#ECFDF5' : '#FFFFFF',
                          cursor: 'pointer',
                        }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tên danh hiệu */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Tên danh hiệu *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '0 12px' }}
                    placeholder="Ví dụ: Chiến binh Kỷ luật, Siêu đầu bếp, Ngôi sao tương tác..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Mô tả */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Mô tả / Hướng dẫn đạt được *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '0 12px' }}
                    placeholder="Ví dụ: Duy trì chuỗi streak ghi nhận dinh dưỡng 7 ngày liên tiếp"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Cấu hình điều kiện */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Loại điều kiện mở khóa *
                    </label>
                    <select
                      className="role-select"
                      style={{ width: '100%', height: '40px' }}
                      value={formData.conditionType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditionType: e.target.value as AchievementConditionType,
                        })
                      }>
                      {Object.entries(CONDITION_TYPE_LABELS).map(([type, info]) => (
                        <option key={type} value={type}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Ngưỡng đạt (Threshold) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ width: '100%', height: '40px', padding: '0 45px 0 12px' }}
                        placeholder="Số lượng"
                        value={formData.threshold}
                        onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '11px',
                          fontSize: '12px',
                          color: '#94A3B8',
                          fontWeight: 500,
                        }}>
                        {CONDITION_TYPE_LABELS[formData.conditionType]?.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview Huy hiệu */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}>
                  <div
                    style={{
                      fontSize: '32px',
                      width: '54px',
                      height: '54px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    }}>
                    {formData.icon || '🏆'}
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                      Xem trước huy hiệu hiển thị trên ứng dụng
                    </span>
                    <strong style={{ fontSize: '15px', color: '#0F172A', display: 'block' }}>
                      {formData.name || 'Tên danh hiệu'}
                    </strong>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {formData.description || 'Mô tả điều kiện đạt được...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingAchievement ? 'Lưu thay đổi' : 'Tạo danh hiệu'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL XÁC NHẬN XÓA */}
      {isDeleteModalOpen && achievementToDelete && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#EF4444' }}>
                Xác nhận xóa danh hiệu
              </h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa danh hiệu <strong>"{achievementToDelete.name}"</strong> (
                {achievementToDelete.icon}) khỏi hệ thống không?
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '8px' }}>
                Người dùng đã đạt được danh hiệu này có thể không còn hiển thị huy hiệu này nữa.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}>
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="btn-spinner" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
