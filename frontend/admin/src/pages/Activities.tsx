import React, { useState, useEffect, useCallback } from 'react';
import { adminActivityService } from '../services/activity.service';
import { Activity, ActivityPagination } from '../types/activity.types';
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
  Flame,
  CheckCircle2,
  Dumbbell,
  Layers,
  Zap,
} from 'lucide-react';

const PRESET_CATEGORIES = [
  'Cardio',
  'Kháng lực (Strength)',
  'Giãn cơ & Yoga',
  'Thể thao đối kháng',
  'Sinh hoạt & Đi bộ',
  'Tập luyện',
  'Khác',
];

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<ActivityPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    met_value: '',
    category: 'Cardio',
    customCategory: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminActivityService.getActivities({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        category: selectedCategory,
      });

      if (res.success && res.data) {
        setActivities(res.data.activities || []);
        setPagination(res.data.pagination);
        if (res.data.categories && res.data.categories.length > 0) {
          const merged = Array.from(new Set([...PRESET_CATEGORIES, ...res.data.categories]));
          setCategories(merged);
        } else {
          setCategories(PRESET_CATEGORIES);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải hoạt động:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Open Add Modal
  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormData({
      name: '',
      met_value: '',
      category: 'Cardio',
      customCategory: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (act: Activity) => {
    setEditingActivity(act);
    const isPreset = PRESET_CATEGORIES.includes(act.category);
    setFormData({
      name: act.name,
      met_value: String(act.met_value),
      category: isPreset ? act.category : 'Khác',
      customCategory: isPreset ? '' : act.category,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Form (Add / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên hoạt động / bài tập');
      return;
    }

    const metNum = parseFloat(formData.met_value);
    if (isNaN(metNum) || metNum <= 0) {
      setFormError('Chỉ số MET phải là một số lớn hơn 0');
      return;
    }

    let finalCategory = formData.category;
    if (formData.category === 'Khác') {
      if (!formData.customCategory.trim()) {
        setFormError('Vui lòng nhập tên danh mục tùy chỉnh');
        return;
      }
      finalCategory = formData.customCategory.trim();
    }

    setIsSubmitting(true);
    try {
      if (editingActivity) {
        // Cập nhật
        await adminActivityService.updateActivity(editingActivity._id, {
          name: formData.name.trim(),
          met_value: metNum,
          category: finalCategory,
        });
        showToast(`Đã cập nhật bài tập "${formData.name.trim()}" thành công!`);
      } else {
        // Tạo mới
        await adminActivityService.createActivity({
          name: formData.name.trim(),
          met_value: metNum,
          category: finalCategory,
        });
        showToast(`Đã thêm bài tập "${formData.name.trim()}" mới thành công!`);
      }
      setIsFormModalOpen(false);
      fetchActivities();
    } catch (err: any) {
      console.error('Lỗi khi lưu bài tập:', err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (act: Activity) => {
    setActivityToDelete(act);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await adminActivityService.deleteActivity(activityToDelete._id);
      showToast(`Đã xóa bài tập "${activityToDelete.name}" thành công!`);
      setIsDeleteModalOpen(false);
      setActivityToDelete(null);
      fetchActivities();
    } catch (err: any) {
      console.error('Lỗi khi xóa bài tập:', err);
      alert(err.response?.data?.message || 'Không thể xóa bài tập này.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Ước tính calo tiêu hao 1h cho người 60kg: MET * 60 * 1h
  const calculateCalories60kg = (met: number) => {
    return Math.round(met * 60);
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
          <h2 className="page-heading">Quản lý Hoạt động thể chất</h2>
          <p className="page-subheading">
            Cấu hình danh mục bài tập, chỉ số MET và mức độ đốt cháy calo cho người dùng
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchActivities} className="btn-secondary" title="Làm mới">
            <RefreshCw size={16} className={isLoading ? 'btn-spinner' : ''} />
            <span>Làm mới</span>
          </button>
          <button onClick={handleOpenCreateModal} className="btn-primary">
            <Plus size={16} />
            <span>Thêm bài tập mới</span>
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
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}>
            <Dumbbell size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Tổng số bài tập
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
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              Phân loại bài tập
            </span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              {categories.length}
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
              Chỉ số MET trung bình
            </span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              {activities.length > 0
                ? (
                    activities.reduce((sum, a) => sum + (a.met_value || 0), 0) / activities.length
                  ).toFixed(1)
                : '0.0'}
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
            placeholder="Tìm theo tên bài tập / hoạt động..."
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
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}>
            <option value="all">Tất cả phân loại</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
          <button onClick={fetchActivities} className="btn-retry">
            Thử lại
          </button>
        </div>
      )}

      {/* 5. BẢNG DANH SÁCH HOẠT ĐỘNG */}
      <div className="table-card">
        {isLoading ? (
          <div className="table-loading-container">
            <Loader2 size={32} className="btn-spinner" color="#10B981" />
            <p>Đang tải danh mục bài tập...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="table-empty-container">
            <Dumbbell size={40} color="#94A3B8" />
            <p className="empty-title">Không tìm thấy hoạt động nào</p>
            <p className="empty-desc">
              {searchTerm || selectedCategory !== 'all'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc phân loại.'
                : 'Chưa có hoạt động nào trong hệ thống. Hãy thêm bài tập đầu tiên!'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên hoạt động / Bài tập</th>
                <th>Phân loại</th>
                <th style={{ textAlign: 'center' }}>Chỉ số MET</th>
                <th style={{ textAlign: 'center' }}>Đốt cháy (kcal/h)</th>
                <th>Người tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => {
                const kcal = calculateCalories60kg(act.met_value);
                return (
                  <tr key={act._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0F172A',
                          }}>
                          <Zap size={17} color="#3B82F6" />
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0F172A' }}>{act.name}</strong>
                        </div>
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
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                        }}>
                        {act.category || 'Tập luyện'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: act.met_value >= 7 ? '#EF4444' : act.met_value >= 4 ? '#D97706' : '#10B981',
                        }}>
                        {act.met_value.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>
                        ~<strong>{kcal}</strong> kcal/h
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {act.created_by_admin_id?.full_name || 'Hệ thống'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditModal(act)}
                          className="action-btn"
                          title="Chỉnh sửa bài tập"
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
                          onClick={() => handleOpenDeleteModal(act)}
                          className="action-btn"
                          title="Xóa bài tập"
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
              <strong>{pagination.total}</strong> bài tập
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

      {/* 7. MODAL THÊM / SỬA BÀI TẬP */}
      {isFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingActivity ? 'Chỉnh sửa hoạt động thể chất' : 'Thêm hoạt động thể chất mới'}
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

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Tên hoạt động / Bài tập *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', height: '40px', padding: '0 12px' }}
                    placeholder="Ví dụ: Chạy bộ địa hình, Nhảy dây tốc độ cao..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Chỉ số MET *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px' }}
                      placeholder="Ví dụ: 7.5"
                      value={formData.met_value}
                      onChange={(e) => setFormData({ ...formData, met_value: e.target.value })}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                      Đi bộ ~ 3.0 | Gym ~ 5.0 | Chạy ~ 8.0+
                    </span>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Phân loại bài tập
                    </label>
                    <select
                      className="role-select"
                      style={{ width: '100%', height: '40px' }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {PRESET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.category === 'Khác' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Tên danh mục tùy chỉnh *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px' }}
                      placeholder="Nhập tên danh mục bài tập mới..."
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    />
                  </div>
                )}

                {/* Preview đốt cháy calo */}
                {parseFloat(formData.met_value) > 0 && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#FEF3C7',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                    <Flame size={18} color="#D97706" />
                    <span>
                      Ước tính tiêu thụ:{' '}
                      <strong>{calculateCalories60kg(parseFloat(formData.met_value))} kcal</strong> cho 1 giờ tập
                      (người 60kg).
                    </span>
                  </div>
                )}
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
                    <span>{editingActivity ? 'Lưu thay đổi' : 'Thêm bài tập'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL XÁC NHẬN XÓA */}
      {isDeleteModalOpen && activityToDelete && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#EF4444' }}>
                Xác nhận xóa bài tập
              </h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa bài tập <strong>"{activityToDelete.name}"</strong> khỏi hệ thống không?
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '8px' }}>
                Hành động này không thể hoàn tác. Nếu bài tập đã có người dùng ghi nhận nhật ký thì sẽ không thể xóa.
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

export default Activities;
