import React, { useState, useEffect, useCallback } from 'react';
import { adminFoodService } from '../services/food.service';
import { Food, Pagination, CreateFoodPayload, UpdateFoodPayload } from '../types/food.types';
import {
  Search,
  Filter,
  Eye,
  Plus,
  Edit2,
  Trash2,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Calendar,
  Flame,
  CheckCircle2,
  Tag,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Món nước',
  'Món cơm',
  'Salad & Eat Clean',
  'Thịt & Gia cầm',
  'Món nước / Bún',
  'Hải sản',
  'Tráng miệng & Ăn vặt',
  'Đồ uống',
  'Khác',
];

export const Foods: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVerified, setSelectedVerified] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Detail Modal
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Create / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    name_en: string;
    category: string;
    calories_per_100g: string;
    protein_per_100g: string;
    carb_per_100g: string;
    fat_per_100g: string;
    image_url: string;
    is_verified: boolean;
    aliases: string[];
  }>({
    name: '',
    name_en: '',
    category: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carb_per_100g: '',
    fat_per_100g: '',
    image_url: '',
    is_verified: true,
    aliases: [],
  });
  const [newAliasInput, setNewAliasInput] = useState('');

  // Delete Modal
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch foods from API
  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminFoodService.getFoods({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        category: selectedCategory,
        is_verified: selectedVerified,
      });

      if (res.success && res.data) {
        setFoods(res.data.foods);
        setPagination(res.data.pagination);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách món ăn:', error);
      setErrorMessage(
        error.response?.data?.message || 'Không thể tải danh sách món ăn. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory, selectedVerified]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // View Food Detail
  const handleOpenDetail = async (foodId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await adminFoodService.getFoodById(foodId);
      if (res.success && res.data.food) {
        setSelectedFood(res.data.food);
      }
    } catch (error: any) {
      console.error('Lỗi xem chi tiết món ăn:', error);
      alert(error.response?.data?.message || 'Không thể lấy thông tin chi tiết món ăn.');
      setIsDetailModalOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormMode('create');
    setEditingFoodId(null);
    setFormData({
      name: '',
      name_en: '',
      category: COMMON_CATEGORIES[0],
      calories_per_100g: '',
      protein_per_100g: '',
      carb_per_100g: '',
      fat_per_100g: '',
      image_url: '',
      is_verified: true,
      aliases: [],
    });
    setNewAliasInput('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (food: Food) => {
    setFormMode('edit');
    setEditingFoodId(food._id);
    setFormData({
      name: food.name || '',
      name_en: food.name_en || '',
      category: food.category || '',
      calories_per_100g: food.calories_per_100g !== undefined && food.calories_per_100g !== null ? food.calories_per_100g.toString() : '',
      protein_per_100g: food.protein_per_100g !== undefined && food.protein_per_100g !== null ? food.protein_per_100g.toString() : '',
      carb_per_100g: food.carb_per_100g !== undefined && food.carb_per_100g !== null ? food.carb_per_100g.toString() : '',
      fat_per_100g: food.fat_per_100g !== undefined && food.fat_per_100g !== null ? food.fat_per_100g.toString() : '',
      image_url: food.image_url || '',
      is_verified: food.is_verified ?? true,
      aliases: food.aliases ? [...food.aliases] : [],
    });
    setNewAliasInput('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Add Alias Chip
  const handleAddAlias = () => {
    const trimmed = newAliasInput.trim();
    if (!trimmed) return;
    if (formData.aliases.includes(trimmed)) {
      setNewAliasInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      aliases: [...prev.aliases, trimmed],
    }));
    setNewAliasInput('');
  };

  // Remove Alias Chip
  const handleRemoveAlias = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Submit Create / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic frontend validation
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên món ăn (tiếng Việt).');
      return;
    }

    if (formData.calories_per_100g === '' || isNaN(Number(formData.calories_per_100g)) || Number(formData.calories_per_100g) < 0) {
      setFormError('Lượng calo/100g phải là số hợp lệ >= 0.');
      return;
    }

    const payload: CreateFoodPayload | UpdateFoodPayload = {
      name: formData.name.trim(),
      name_en: formData.name_en.trim() ? formData.name_en.trim() : null,
      category: formData.category.trim() ? formData.category.trim() : null,
      calories_per_100g: Number(formData.calories_per_100g),
      protein_per_100g: formData.protein_per_100g !== '' ? Number(formData.protein_per_100g) : null,
      carb_per_100g: formData.carb_per_100g !== '' ? Number(formData.carb_per_100g) : null,
      fat_per_100g: formData.fat_per_100g !== '' ? Number(formData.fat_per_100g) : null,
      image_url: formData.image_url.trim() ? formData.image_url.trim() : null,
      is_verified: formData.is_verified,
      aliases: formData.aliases,
    };

    setIsFormSubmitting(true);

    try {
      if (formMode === 'create') {
        const res = await adminFoodService.createFood(payload as CreateFoodPayload);
        if (res.success) {
          setSuccessToast(res.message || 'Thêm món ăn mới thành công!');
          setTimeout(() => setSuccessToast(null), 3000);
          setIsFormModalOpen(false);
          fetchFoods();
        }
      } else if (formMode === 'edit' && editingFoodId) {
        const res = await adminFoodService.updateFood(editingFoodId, payload as UpdateFoodPayload);
        if (res.success) {
          setSuccessToast(res.message || 'Cập nhật món ăn thành công!');
          setTimeout(() => setSuccessToast(null), 3000);
          setIsFormModalOpen(false);
          fetchFoods();
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu món ăn:', error);
      setFormError(error.response?.data?.message || 'Không thể lưu món ăn. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (food: Food) => {
    setFoodToDelete(food);
    setDeleteError(null);
  };

  // Confirm Delete Food Item
  const handleConfirmDelete = async () => {
    if (!foodToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await adminFoodService.deleteFood(foodToDelete._id);
      if (res.success) {
        setSuccessToast(res.message || 'Đã xóa món ăn thành công!');
        setTimeout(() => setSuccessToast(null), 3000);
        setFoodToDelete(null);
        fetchFoods();
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa món ăn:', error);
      setDeleteError(error.response?.data?.message || 'Không thể xóa món ăn. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="users-page">
      {/* Toast Notification */}
      {successToast && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Quản lý Món ăn & Dinh dưỡng</h1>
          <p className="page-subheading">
            Từ điển thực phẩm tiêu chuẩn hóa, định lượng Calo và các thành phần Macro (Đạm, Đường bột, Chất béo).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={fetchFoods}
            disabled={isLoading}
            title="Làm mới danh sách">
            <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            className="btn-primary"
            onClick={handleOpenCreateModal}
            title="Thêm món ăn mới">
            <Plus size={18} />
            <span>Thêm món ăn</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo tên món, tên tiếng Anh, bí danh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Xóa tìm kiếm">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="role-filter-group">
          <Filter size={16} className="filter-icon" />
          <select
            className="role-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}>
            <option value="all">Tất cả danh mục</option>
            {COMMON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Filter */}
        <div className="role-filter-group">
          <ShieldCheck size={16} className="filter-icon" />
          <select
            className="role-select"
            value={selectedVerified}
            onChange={(e) => {
              setSelectedVerified(e.target.value);
              setCurrentPage(1);
            }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đã xác thực</option>
            <option value="false">Chưa xác thực</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÓN ĂN / THỰC PHẨM</th>
                <th>DANH MỤC</th>
                <th>CALO (100G)</th>
                <th>ĐẠM (P)</th>
                <th>ĐƯỜNG BỘT (C)</th>
                <th>CHẤT BÉO (F)</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY TẠO</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="table-loading">
                      <Loader2 size={32} className="spinner" />
                      <p>Đang tải danh sách món ăn...</p>
                    </div>
                  </td>
                </tr>
              ) : foods.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="table-empty">
                      <UtensilsCrossed size={48} color="#CBD5E1" />
                      <h3>Không tìm thấy món ăn nào</h3>
                      <p>
                        {debouncedSearch || selectedCategory !== 'all' || selectedVerified !== 'all'
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc danh mục/trạng thái.'
                          : 'Hệ thống chưa có món ăn nào. Nhấn "+ Thêm món ăn" để bắt đầu!'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                foods.map((food) => (
                  <tr key={food._id}>
                    {/* Food Name & Image */}
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                          {food.image_url ? (
                            <img
                              src={food.image_url}
                              alt={food.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <UtensilsCrossed size={18} color="#10B981" />
                          )}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{food.name}</span>
                          {food.name_en && (
                            <span style={{ fontSize: '11.5px', color: '#64748B', fontStyle: 'italic' }}>
                              {food.name_en}
                            </span>
                          )}
                          {food.aliases && food.aliases.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                              {food.aliases.slice(0, 2).map((alias, aIdx) => (
                                <span
                                  key={aIdx}
                                  style={{
                                    fontSize: '10.5px',
                                    backgroundColor: '#F1F5F9',
                                    color: '#475569',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}>
                                  {alias}
                                </span>
                              ))}
                              {food.aliases.length > 2 && (
                                <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                                  +{food.aliases.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}>
                        {food.category || 'Chưa phân loại'}
                      </span>
                    </td>

                    {/* Calories */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#D97706' }}>
                        <Flame size={15} color="#F59E0B" />
                        <span>{food.calories_per_100g}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>kcal</span>
                      </div>
                    </td>

                    {/* Protein */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {food.protein_per_100g !== null && food.protein_per_100g !== undefined ? `${food.protein_per_100g}g` : '--'}
                      </span>
                    </td>

                    {/* Carb */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#2563EB' }}>
                        {food.carb_per_100g !== null && food.carb_per_100g !== undefined ? `${food.carb_per_100g}g` : '--'}
                      </span>
                    </td>

                    {/* Fat */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#7C3AED' }}>
                        {food.fat_per_100g !== null && food.fat_per_100g !== undefined ? `${food.fat_per_100g}g` : '--'}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td>
                      {food.is_verified ? (
                        <span className="role-pill role-pill-admin" style={{ gap: '4px' }}>
                          <ShieldCheck size={13} />
                          <span>Đã xác thực</span>
                        </span>
                      ) : (
                        <span className="role-pill" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', gap: '4px' }}>
                          <ShieldAlert size={13} />
                          <span>Chưa duyệt</span>
                        </span>
                      )}
                    </td>

                    {/* Created At */}
                    <td style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {formatDate(food.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-cell">
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => handleOpenDetail(food._id)}
                          title="Xem chi tiết">
                          <Eye size={14} />
                          <span>Xem</span>
                        </button>
                        <button
                          className="action-btn action-btn-role"
                          onClick={() => handleOpenEditModal(food)}
                          title="Chỉnh sửa món ăn">
                          <Edit2 size={14} />
                          <span>Sửa</span>
                        </button>
                        <button
                          className="action-btn"
                          style={{
                            backgroundColor: '#FEF2F2',
                            borderColor: '#FECACA',
                            color: '#DC2626',
                          }}
                          onClick={() => handleOpenDeleteModal(food)}
                          title="Xóa món ăn">
                          <Trash2 size={14} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Hiển thị <strong>{foods.length}</strong> / <strong>{pagination.total}</strong> món ăn
            {pagination.totalPages > 0 && ` (Trang ${pagination.page} / ${pagination.totalPages})`}
          </div>

          <div className="pagination-actions">
            <button
              className="pagination-btn"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
              <ChevronLeft size={16} />
              <span>Trước</span>
            </button>

            <span className="pagination-pages">
              Trang <strong>{pagination.page || 1}</strong> / {pagination.totalPages || 1}
            </span>

            <button
              className="pagination-btn"
              disabled={currentPage >= pagination.totalPages || isLoading}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}>
              <span>Sau</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. DETAIL MODAL
          ========================================================================= */}
      {isDetailModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="modal-card modal-detail-card"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết Món ăn & Dinh dưỡng</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsDetailModalOpen(false)}
                title="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {isDetailLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Loader2 size={32} className="spinner" />
                  <p style={{ marginTop: '8px', color: '#64748B' }}>Đang tải thông tin món ăn...</p>
                </div>
              ) : selectedFood ? (
                <div>
                  {/* Hero Banner */}
                  <div className="detail-profile-hero" style={{ alignItems: 'flex-start' }}>
                    <div
                      className="detail-avatar"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}>
                      {selectedFood.image_url ? (
                        <img src={selectedFood.image_url} alt={selectedFood.name} />
                      ) : (
                        <UtensilsCrossed size={32} color="#10B981" />
                      )}
                    </div>
                    <div className="detail-hero-text" style={{ flex: 1 }}>
                      <h4>{selectedFood.name}</h4>
                      {selectedFood.name_en && (
                        <div className="detail-email" style={{ fontStyle: 'italic' }}>
                          {selectedFood.name_en}
                        </div>
                      )}
                      <div className="detail-tags-row" style={{ marginTop: '8px' }}>
                        <span className="id-badge">ID: {selectedFood._id}</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}>
                          {selectedFood.category || 'Chưa phân loại'}
                        </span>
                        {selectedFood.is_verified ? (
                          <span className="role-pill role-pill-admin" style={{ fontSize: '11px' }}>
                            <ShieldCheck size={12} />
                            <span>Đã xác thực</span>
                          </span>
                        ) : (
                          <span
                            className="role-pill"
                            style={{
                              fontSize: '11px',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                            }}>
                            <ShieldAlert size={12} />
                            <span>Chưa duyệt</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Values Section */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      <Flame size={16} color="#F59E0B" />
                      <span>Thông số Dinh dưỡng (trên 100g)</span>
                    </div>
                    <div className="detail-grid-4">
                      <div className="detail-box">
                        <span className="box-label">Năng lượng Calo</span>
                        <span className="box-value" style={{ color: '#D97706' }}>
                          {selectedFood.calories_per_100g} <span style={{ fontSize: '12px', fontWeight: 500 }}>kcal</span>
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Chất đạm (Protein)</span>
                        <span className="box-value" style={{ color: '#059669' }}>
                          {selectedFood.protein_per_100g !== null && selectedFood.protein_per_100g !== undefined
                            ? `${selectedFood.protein_per_100g} g`
                            : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Chất bột đường (Carb)</span>
                        <span className="box-value" style={{ color: '#2563EB' }}>
                          {selectedFood.carb_per_100g !== null && selectedFood.carb_per_100g !== undefined
                            ? `${selectedFood.carb_per_100g} g`
                            : '--'}
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Chất béo (Fat)</span>
                        <span className="box-value" style={{ color: '#7C3AED' }}>
                          {selectedFood.fat_per_100g !== null && selectedFood.fat_per_100g !== undefined
                            ? `${selectedFood.fat_per_100g} g`
                            : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aliases Section */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      <Tag size={16} color="#3B82F6" />
                      <span>Bí danh / Tên gọi khác (Hỗ trợ AI NLP)</span>
                    </div>
                    {selectedFood.aliases && selectedFood.aliases.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedFood.aliases.map((alias, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '12.5px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1E40AF',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 600,
                            }}>
                            {alias}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                        Chưa có bí danh nào được thêm.
                      </span>
                    )}
                  </div>

                  {/* Metadata Section */}
                  <div className="detail-timestamps">
                    <Calendar size={14} />
                    <span>Thời điểm tạo: {formatDate(selectedFood.created_at)}</span>
                    {selectedFood.created_by_admin_id && (
                      <span style={{ marginLeft: '12px' }}>
                        • Người tạo (Admin ID): <code>{selectedFood.created_by_admin_id}</code>
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </button>
              {selectedFood && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(selectedFood);
                  }}>
                  <Edit2 size={16} />
                  <span>Chỉnh sửa món này</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. CREATE / EDIT MODAL FORM
          ========================================================================= */}
      {isFormModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormModalOpen(false)}>
          <div
            className="modal-card modal-detail-card"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formMode === 'create' ? 'Thêm Món Ăn Mới' : 'Chỉnh Sửa Món Ăn'}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsFormModalOpen(false)}
                title="Đóng">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ maxHeight: '75vh' }}>
                {formError && (
                  <div className="modal-error-banner">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name & Name_en */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      Tên món ăn (tiếng Việt) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="VD: Phở bò tái"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      Tên tiếng Anh (tuỳ chọn)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="VD: Beef Pho with Rare Beef"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                  </div>
                </div>

                {/* Category & Verified */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      Danh mục món
                    </label>
                    <input
                      type="text"
                      list="categories-list"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Chọn hoặc nhập danh mục"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="categories-list">
                      {COMMON_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      Trạng thái duyệt
                    </label>
                    <div
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        paddingLeft: '12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                      <input
                        type="checkbox"
                        id="is_verified_checkbox"
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                        checked={formData.is_verified}
                        onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                      />
                      <label htmlFor="is_verified_checkbox" style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                        Đã xác thực (Verified)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nutrition 4-box grid */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Thành phần Dinh dưỡng (chuẩn hóa trên 100g)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#D97706' }}>Calo (kcal) *</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px', marginTop: '4px' }}
                        placeholder="120"
                        value={formData.calories_per_100g}
                        onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#059669' }}>Đạm (g)</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px', marginTop: '4px' }}
                        placeholder="8.5"
                        value={formData.protein_per_100g}
                        onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#2563EB' }}>Đường bột (g)</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px', marginTop: '4px' }}
                        placeholder="15.0"
                        value={formData.carb_per_100g}
                        onChange={(e) => setFormData({ ...formData, carb_per_100g: e.target.value })}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#7C3AED' }}>Chất béo (g)</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px', marginTop: '4px' }}
                        placeholder="3.2"
                        value={formData.fat_per_100g}
                        onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Image URL */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Đường dẫn ảnh minh họa (URL)
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <ImageIcon size={18} className="input-icon" style={{ left: '14px' }} />
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>
                    {formData.image_url && (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          overflow: 'hidden',
                          backgroundColor: '#F8FAFC',
                          flexShrink: 0,
                        }}>
                        <img
                          src={formData.image_url}
                          alt="preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Aliases Manager */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Bí danh / Tên gọi thay thế (Hỗ trợ AI khớp món)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '14px', height: '42px' }}
                      placeholder="Nhập tên gọi khác (VD: pho bo, phở nạm...)"
                      value={newAliasInput}
                      onChange={(e) => setNewAliasInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAlias();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: '42px', padding: '0 16px' }}
                      onClick={handleAddAlias}>
                      + Thêm
                    </button>
                  </div>

                  {formData.aliases.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {formData.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}>
                          <span>{alias}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAlias(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                            }}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      Chưa có bí danh nào. Thêm các tên gọi thân thuộc để AI dễ dàng khớp món.
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isFormSubmitting}>
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isFormSubmitting}>
                  {isFormSubmitting ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{formMode === 'create' ? 'Tạo Món Ăn' : 'Lưu Thay Đổi'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {foodToDelete && (
        <div className="modal-backdrop" onClick={() => setFoodToDelete(null)}>
          <div
            className="modal-card modal-role-card"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#DC2626' }}>Xác nhận xóa món ăn</h3>
              <button
                className="modal-close-btn"
                onClick={() => setFoodToDelete(null)}
                title="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {deleteError && (
                <div className="modal-error-banner">
                  <AlertCircle size={18} />
                  <span>{deleteError}</span>
                </div>
              )}

              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa vĩnh viễn món ăn sau khỏi từ điển hệ thống không?
              </p>

              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginTop: '12px',
                }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#991B1B' }}>
                  {foodToDelete.name}
                </div>
                {foodToDelete.name_en && (
                  <div style={{ fontSize: '12.5px', color: '#B91C1C', fontStyle: 'italic', marginTop: '2px' }}>
                    {foodToDelete.name_en}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '6px' }}>
                  Danh mục: <strong>{foodToDelete.category || 'Chưa phân loại'}</strong> • Calo: <strong>{foodToDelete.calories_per_100g} kcal/100g</strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  fontSize: '12px',
                  color: '#64748B',
                  lineHeight: '1.4',
                  backgroundColor: '#F8FAFC',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                }}>
                🛡️ <strong>Bảo vệ dữ liệu:</strong> Hệ thống sẽ tự động kiểm tra tham chiếu. Nếu món ăn đang nằm trong nhật ký ăn uống hoặc kế hoạch thực đơn của người dùng, thao tác xóa sẽ bị từ chối để tránh hỏng dữ liệu.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setFoodToDelete(null)}
                disabled={isDeleting}>
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#DC2626', color: '#FFFFFF', borderColor: '#DC2626' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="btn-spinner" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Xóa Vĩnh Viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
