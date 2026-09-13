import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminFoodService } from '../services/food.service';
import { adminUnidentifiedFoodService } from '../services/unidentified_food.service';
import { Food, Pagination, CreateFoodPayload, UpdateFoodPayload } from '../types/food.types';
import {
  UnidentifiedFood,
  UnidentifiedFoodPagination,
  UnidentifiedFoodSummary,
  NewFoodPayload,
} from '../types/unidentified_food.types';
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
  Flame,
  CheckCircle2,
  Tag,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'dictionary' (Từ điển Món ăn) | 'unidentified' (Hàng đợi kiểm duyệt Món lạ)
  const [activeTab, setActiveTab] = useState<'dictionary' | 'unidentified'>(() => {
    return searchParams.get('tab') === 'unidentified' ? 'unidentified' : 'dictionary';
  });

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'unidentified') {
      setActiveTab('unidentified');
    } else if (tabParam === 'dictionary') {
      setActiveTab('dictionary');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'dictionary' | 'unidentified') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // =========================================================================
  // STATE CHO TAB 1: TỪ ĐIỂN MÓN ĂN (FOOD ITEMS)
  // =========================================================================
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

  // Detail Modal (Food)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create / Edit Modal (Food)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State (Food)
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

  // Delete Modal (Food)
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // =========================================================================
  // STATE CHO TAB 2: MÓN ĂN CHƯA XÁC ĐỊNH (UNIDENTIFIED FOODS)
  // Mặc định lọc status = 'pending' để hiển thị đúng các món đang chờ kiểm duyệt
  // =========================================================================
  const [unidentifiedItems, setUnidentifiedItems] = useState<UnidentifiedFood[]>([]);
  const [unidentifiedPagination, setUnidentifiedPagination] = useState<UnidentifiedFoodPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [unidentifiedSummary, setUnidentifiedSummary] = useState<UnidentifiedFoodSummary>({
    total: 0,
    pending: 0,
    resolved: 0,
  });

  const [unidentifiedStatus, setUnidentifiedStatus] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [unidentifiedSearch, setUnidentifiedSearch] = useState('');
  const [debouncedUnidentifiedSearch, setDebouncedUnidentifiedSearch] = useState('');
  const [unidentifiedPage, setUnidentifiedPage] = useState(1);
  const [isUnidentifiedLoading, setIsUnidentifiedLoading] = useState(false);
  const [unidentifiedError, setUnidentifiedError] = useState<string | null>(null);

  // Detail Modal (Unidentified)
  const [selectedUnidentified, setSelectedUnidentified] = useState<UnidentifiedFood | null>(null);
  const [isUnidentifiedDetailOpen, setIsUnidentifiedDetailOpen] = useState(false);

  // Resolve Modal (Unidentified)
  const [unidentifiedToResolve, setUnidentifiedToResolve] = useState<UnidentifiedFood | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveMode, setResolveMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingFoodId, setSelectedExistingFoodId] = useState<string>('');
  const [existingFoodSearchTerm, setExistingFoodSearchTerm] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // New Food Form State inside Resolve Modal
  const [newFoodForm, setNewFoodForm] = useState<NewFoodPayload>({
    name: '',
    name_en: '',
    category: '',
    calories_per_100g: 100,
    protein_per_100g: 5,
    carb_per_100g: 15,
    fat_per_100g: 3,
    aliases: [],
    image_url: '',
  });
  const [resolveAliasInput, setResolveAliasInput] = useState('');

  // Delete Modal (Unidentified)
  const [unidentifiedToDelete, setUnidentifiedToDelete] = useState<UnidentifiedFood | null>(null);
  const [isDeletingUnidentified, setIsDeletingUnidentified] = useState(false);
  const [deleteUnidentifiedError, setDeleteUnidentifiedError] = useState<string | null>(null);

  // All foods for selection in Resolve Modal
  const [allDictionaryFoods, setAllDictionaryFoods] = useState<Food[]>([]);

  // =========================================================================
  // DEBOUNCE SEARCH LOGIC
  // =========================================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUnidentifiedSearch(unidentifiedSearch);
      setUnidentifiedPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [unidentifiedSearch]);

  // =========================================================================
  // FETCH DATA: TAB 1 (FOODS)
  // =========================================================================
  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isVerifiedParam =
        selectedVerified === 'all'
          ? undefined
          : selectedVerified === 'verified'
          ? 'true'
          : 'false';

      const res = await adminFoodService.getFoods({
        search: debouncedSearch || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        is_verified: isVerifiedParam,
        page: currentPage,
        limit: 10,
      });

      if (res.success && res.data) {
        setFoods(res.data.foods);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách món ăn:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể tải danh mục món ăn.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedVerified, currentPage]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // =========================================================================
  // FETCH DATA: TAB 2 (UNIDENTIFIED FOODS)
  // =========================================================================
  const fetchUnidentifiedFoods = useCallback(async () => {
    setIsUnidentifiedLoading(true);
    setUnidentifiedError(null);
    try {
      const res = await adminUnidentifiedFoodService.getUnidentifiedFoods({
        status: unidentifiedStatus,
        search: debouncedUnidentifiedSearch || undefined,
        page: unidentifiedPage,
        limit: 10,
      });

      if (res.success && res.data) {
        setUnidentifiedItems(res.data.items);
        setUnidentifiedPagination(res.data.pagination);
        setUnidentifiedSummary(res.data.summary);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách món ăn chưa xác định:', err);
      setUnidentifiedError(err.response?.data?.message || 'Không thể tải danh sách món ăn chưa xác định.');
    } finally {
      setIsUnidentifiedLoading(false);
    }
  }, [unidentifiedStatus, debouncedUnidentifiedSearch, unidentifiedPage]);

  useEffect(() => {
    fetchUnidentifiedFoods();
  }, [fetchUnidentifiedFoods]);

  // Load all dictionary foods for the resolve modal dropdown
  const loadAllDictionaryFoods = async () => {
    try {
      const res = await adminFoodService.getFoods({ limit: 100 });
      if (res.success && res.data) {
        setAllDictionaryFoods(res.data.foods);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục món ăn:', err);
    }
  };

  useEffect(() => {
    loadAllDictionaryFoods();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // =========================================================================
  // HANDLERS: TAB 1 (FOOD CRUD)
  // =========================================================================
  const handleOpenCreateModal = () => {
    setFormMode('create');
    setEditingFoodId(null);
    setFormData({
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
    setNewAliasInput('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (food: Food) => {
    setFormMode('edit');
    setEditingFoodId(food._id);
    setFormData({
      name: food.name,
      name_en: food.name_en || '',
      category: food.category || '',
      calories_per_100g: food.calories_per_100g.toString(),
      protein_per_100g: food.protein_per_100g !== null && food.protein_per_100g !== undefined ? food.protein_per_100g.toString() : '',
      carb_per_100g: food.carb_per_100g !== null && food.carb_per_100g !== undefined ? food.carb_per_100g.toString() : '',
      fat_per_100g: food.fat_per_100g !== null && food.fat_per_100g !== undefined ? food.fat_per_100g.toString() : '',
      image_url: food.image_url || '',
      is_verified: food.is_verified,
      aliases: food.aliases || [],
    });
    setNewAliasInput('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleAddAlias = () => {
    const val = newAliasInput.trim();
    if (val && !formData.aliases.includes(val)) {
      setFormData({ ...formData, aliases: [...formData.aliases, val] });
      setNewAliasInput('');
    }
  };

  const handleRemoveAlias = (index: number) => {
    setFormData({
      ...formData,
      aliases: formData.aliases.filter((_, i) => i !== index),
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên món ăn tiếng Việt.');
      return;
    }
    const cal = parseFloat(formData.calories_per_100g);
    if (isNaN(cal) || cal < 0) {
      setFormError('Lượng calo trên 100g phải là số không âm.');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const payload: CreateFoodPayload | UpdateFoodPayload = {
        name: formData.name.trim(),
        name_en: formData.name_en.trim() || null,
        category: formData.category.trim() || null,
        calories_per_100g: cal,
        protein_per_100g: formData.protein_per_100g ? parseFloat(formData.protein_per_100g) : null,
        carb_per_100g: formData.carb_per_100g ? parseFloat(formData.carb_per_100g) : null,
        fat_per_100g: formData.fat_per_100g ? parseFloat(formData.fat_per_100g) : null,
        image_url: formData.image_url.trim() || null,
        is_verified: formData.is_verified,
        aliases: formData.aliases,
      };

      if (formMode === 'create') {
        const res = await adminFoodService.createFood(payload as CreateFoodPayload);
        if (res.success) {
          triggerToast('Tạo món ăn mới thành công!');
          setIsFormModalOpen(false);
          fetchFoods();
          loadAllDictionaryFoods();
        }
      } else if (formMode === 'edit' && editingFoodId) {
        const res = await adminFoodService.updateFood(editingFoodId, payload as UpdateFoodPayload);
        if (res.success) {
          triggerToast('Cập nhật thông tin món ăn thành công!');
          setIsFormModalOpen(false);
          fetchFoods();
          loadAllDictionaryFoods();
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu món ăn:', err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu món ăn.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!foodToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminFoodService.deleteFood(foodToDelete._id);
      if (res.success) {
        triggerToast('Xóa món ăn thành công!');
        setFoodToDelete(null);
        fetchFoods();
        loadAllDictionaryFoods();
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa món ăn:', err);
      setDeleteError(err.response?.data?.message || 'Không thể xóa món ăn.');
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // HANDLERS: TAB 2 (UNIDENTIFIED FOOD MODERATION)
  // =========================================================================
  const handleOpenResolveModal = (item: UnidentifiedFood) => {
    setUnidentifiedToResolve(item);
    setResolveMode('existing');
    setSelectedExistingFoodId('');
    setExistingFoodSearchTerm('');
    setResolveError(null);
    setNewFoodForm({
      name: item.name_guess || '',
      name_en: '',
      category: '',
      calories_per_100g: 100,
      protein_per_100g: 5,
      carb_per_100g: 15,
      fat_per_100g: 3,
      aliases: item.name_guess ? [item.name_guess] : [],
      image_url: item.image_url || '',
    });
    setResolveAliasInput('');
    setIsResolveModalOpen(true);
  };

  const handleAddResolveAlias = () => {
    const val = resolveAliasInput.trim();
    if (val && !newFoodForm.aliases?.includes(val)) {
      setNewFoodForm({
        ...newFoodForm,
        aliases: [...(newFoodForm.aliases || []), val],
      });
      setResolveAliasInput('');
    }
  };

  const handleRemoveResolveAlias = (index: number) => {
    setNewFoodForm({
      ...newFoodForm,
      aliases: (newFoodForm.aliases || []).filter((_, i) => i !== index),
    });
  };

  const handleExecuteResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidentifiedToResolve) return;

    setResolveError(null);
    setIsResolving(true);

    try {
      if (resolveMode === 'existing') {
        if (!selectedExistingFoodId) {
          setResolveError('Vui lòng chọn một món ăn có sẵn từ danh sách.');
          setIsResolving(false);
          return;
        }

        const res = await adminUnidentifiedFoodService.resolveWithExistingFood(
          unidentifiedToResolve._id,
          selectedExistingFoodId
        );
        if (res.success) {
          triggerToast('Chuẩn hóa món ăn thành công!');
          setIsResolveModalOpen(false);
          fetchUnidentifiedFoods();
        }
      } else {
        // Mode 'new'
        if (!newFoodForm.name.trim()) {
          setResolveError('Tên món ăn mới không được để trống.');
          setIsResolving(false);
          return;
        }
        if (newFoodForm.calories_per_100g < 0) {
          setResolveError('Lượng calo phải là số không âm.');
          setIsResolving(false);
          return;
        }

        const res = await adminUnidentifiedFoodService.resolveWithNewFood(
          unidentifiedToResolve._id,
          {
            ...newFoodForm,
            name: newFoodForm.name.trim(),
            name_en: newFoodForm.name_en?.trim() || null,
            category: newFoodForm.category?.trim() || null,
            image_url: newFoodForm.image_url?.trim() || null,
          }
        );

        if (res.success) {
          triggerToast('Tạo món ăn mới và chuẩn hóa thành công!');
          setIsResolveModalOpen(false);
          fetchUnidentifiedFoods();
          fetchFoods();
          loadAllDictionaryFoods();
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi chuẩn hóa món ăn:', err);
      setResolveError(err.response?.data?.message || 'Có lỗi xảy ra khi chuẩn hóa.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDeleteUnidentified = async () => {
    if (!unidentifiedToDelete) return;
    setIsDeletingUnidentified(true);
    setDeleteUnidentifiedError(null);
    try {
      const res = await adminUnidentifiedFoodService.deleteUnidentifiedFood(unidentifiedToDelete._id);
      if (res.success) {
        triggerToast('Xóa bản ghi báo cáo thành công!');
        setUnidentifiedToDelete(null);
        fetchUnidentifiedFoods();
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa báo cáo món lạ:', err);
      setDeleteUnidentifiedError(err.response?.data?.message || 'Không thể xóa bản ghi báo cáo.');
    } finally {
      setIsDeletingUnidentified(false);
    }
  };

  // Filtered dictionary foods for Option A autocomplete in resolve modal
  const filteredExistingFoods = allDictionaryFoods.filter((f) =>
    f.name.toLowerCase().includes(existingFoodSearchTerm.toLowerCase()) ||
    (f.name_en && f.name_en.toLowerCase().includes(existingFoodSearchTerm.toLowerCase()))
  );

  return (
    <div className="users-page">
      {/* 1. Header & Tab Navigation */}
      <div className="page-header-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-heading">Quản lý Món ăn & Kiểm duyệt Dinh dưỡng</h1>
          <p className="page-subheading">
            Từ điển thực phẩm tiêu chuẩn hóa, định lượng Calo/Macro và hàng đợi tiếp nhận món ăn chưa xác định từ AI.
          </p>

          {/* 2-Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleTabChange('dictionary')}
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
                backgroundColor: activeTab === 'dictionary' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'dictionary' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'dictionary' ? '#10B981' : '#E2E8F0',
                transition: 'all 0.2s ease',
              }}>
              <UtensilsCrossed size={16} />
              <span>Từ điển Món ăn ({pagination.total})</span>
            </button>

            <button
              onClick={() => handleTabChange('unidentified')}
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
                backgroundColor: activeTab === 'unidentified' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'unidentified' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'unidentified' ? '#10B981' : '#E2E8F0',
                transition: 'all 0.2s ease',
              }}>
              <HelpCircle size={16} />
              <span>Kiểm duyệt Món lạ</span>
              {unidentifiedSummary.pending > 0 && (
                <span
                  style={{
                    backgroundColor: activeTab === 'unidentified' ? '#FEF3C7' : '#F59E0B',
                    color: activeTab === 'unidentified' ? '#92400E' : '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    marginLeft: '4px',
                  }}>
                  {unidentifiedSummary.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action Header Button for Tab 1 */}
        {activeTab === 'dictionary' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-secondary" onClick={fetchFoods} title="Làm mới">
              <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
              <span>Làm mới</span>
            </button>
            <button className="btn-primary" onClick={handleOpenCreateModal}>
              <Plus size={16} />
              <span>Thêm món ăn</span>
            </button>
          </div>
        )}

        {/* Action Header Button for Tab 2 */}
        {activeTab === 'unidentified' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-secondary" onClick={fetchUnidentifiedFoods} title="Làm mới">
              <RefreshCw size={16} className={isUnidentifiedLoading ? 'spinner' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Success Toast */}
      {successToast && (
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
          <span>{successToast}</span>
        </div>
      )}

      {/* =====================================================================
          TAB 1: TỪ ĐIỂN MÓN ĂN (FOOD DICTIONARY)
          ===================================================================== */}
      {activeTab === 'dictionary' && (
        <>
          {/* Error Banner */}
          {errorMessage && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="filter-bar">
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
                <option value="all">Tất cả danh mục</option>
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="role-filter-group">
              <Filter size={17} className="filter-icon" />
              <select
                className="role-select"
                value={selectedVerified}
                onChange={(e) => {
                  setSelectedVerified(e.target.value);
                  setCurrentPage(1);
                }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="verified">Đã xác thực</option>
                <option value="unverified">Chưa xác thực</option>
              </select>
            </div>
          </div>

          {/* Food Items Table */}
          <div className="table-card">
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
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                        <Loader2 size={28} className="spinner" style={{ margin: '0 auto', color: '#10B981' }} />
                        <span style={{ display: 'block', marginTop: '8px', color: '#64748B' }}>
                          Đang tải danh mục món ăn...
                        </span>
                      </td>
                    </tr>
                  ) : foods.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                        <UtensilsCrossed size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                        <h4 style={{ color: '#1E293B', fontSize: '15px' }}>Không tìm thấy món ăn nào</h4>
                        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>
                          Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc danh mục/trạng thái.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    foods.map((food) => (
                      <tr key={food._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                              {food.image_url ? (
                                <img
                                  src={food.image_url}
                                  alt={food.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <UtensilsCrossed size={18} color="#94A3B8" />
                              )}
                            </div>
                            <div>
                              <strong style={{ color: '#0F172A', fontSize: '14px', display: 'block' }}>
                                {food.name}
                              </strong>
                              {food.name_en && (
                                <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic', display: 'block' }}>
                                  {food.name_en}
                                </span>
                              )}
                              {food.aliases && food.aliases.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                                  {food.aliases.slice(0, 2).map((alias, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: '11px',
                                        backgroundColor: '#F1F5F9',
                                        color: '#475569',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                      }}>
                                      {alias}
                                    </span>
                                  ))}
                                  {food.aliases.length > 2 && (
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                      +{food.aliases.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="role-tag" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
                            {food.category || 'Chưa phân loại'}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#D97706' }}>
                            <Flame size={14} />
                            <span>{food.calories_per_100g} kcal</span>
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#059669' }}>
                            {food.protein_per_100g !== null && food.protein_per_100g !== undefined ? `${food.protein_per_100g}g` : '--'}
                          </strong>
                        </td>
                        <td>
                          <strong style={{ color: '#2563EB' }}>
                            {food.carb_per_100g !== null && food.carb_per_100g !== undefined ? `${food.carb_per_100g}g` : '--'}
                          </strong>
                        </td>
                        <td>
                          <strong style={{ color: '#7C3AED' }}>
                            {food.fat_per_100g !== null && food.fat_per_100g !== undefined ? `${food.fat_per_100g}g` : '--'}
                          </strong>
                        </td>
                        <td>
                          {food.is_verified ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                              }}>
                              <ShieldCheck size={14} />
                              <span>Đã xác thực</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                              }}>
                              <ShieldAlert size={14} />
                              <span>Chưa xác thực</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            {food.created_at ? new Date(food.created_at).toLocaleDateString('vi-VN') : '--'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              className="action-btn"
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedFood(food);
                                setIsDetailModalOpen(true);
                              }}>
                              <Eye size={16} />
                              <span>Xem</span>
                            </button>
                            <button
                              className="action-btn"
                              title="Chỉnh sửa"
                              onClick={() => handleOpenEditModal(food)}>
                              <Edit2 size={16} color="#059669" />
                              <span style={{ color: '#059669' }}>Sửa</span>
                            </button>
                            <button
                              className="action-btn"
                              title="Xóa món ăn"
                              onClick={() => {
                                setFoodToDelete(food);
                                setDeleteError(null);
                              }}>
                              <Trash2 size={16} color="#DC2626" />
                              <span style={{ color: '#DC2626' }}>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && foods.length > 0 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Hiển thị <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> –{' '}
                  <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong
                  tổng số <strong>{pagination.total}</strong> món ăn
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
        </>
      )}

      {/* =====================================================================
          TAB 2: MÓN ĂN CHƯA XÁC ĐỊNH (MODERATION QUEUE)
          ===================================================================== */}
      {activeTab === 'unidentified' && (
        <>
          {/* Error Banner */}
          {unidentifiedError && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{unidentifiedError}</span>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên dự đoán của người dùng..."
                value={unidentifiedSearch}
                onChange={(e) => setUnidentifiedSearch(e.target.value)}
              />
              {unidentifiedSearch && (
                <button className="clear-search-btn" onClick={() => setUnidentifiedSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="role-filter-group">
              <Filter size={17} className="filter-icon" />
              <select
                className="role-select"
                value={unidentifiedStatus}
                onChange={(e) => {
                  setUnidentifiedStatus(e.target.value as any);
                  setUnidentifiedPage(1);
                }}>
                <option value="pending">Chờ xử lý ({unidentifiedSummary.pending})</option>
                <option value="resolved">Đã chuẩn hóa ({unidentifiedSummary.resolved})</option>
                <option value="all">Tất cả lịch sử ({unidentifiedSummary.total})</option>
              </select>
            </div>
          </div>

          {/* Unidentified Foods Table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>HÌNH ẢNH</th>
                    <th>TÊN DỰ ĐOÁN (USER GỬI)</th>
                    <th>NGƯỜI BÁO CÁO</th>
                    <th>TRẠNG THÁI</th>
                    <th>KẾT QUẢ CHUẨN HÓA</th>
                    <th>NGÀY GỬI</th>
                    <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {isUnidentifiedLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <Loader2 size={28} className="spinner" style={{ margin: '0 auto', color: '#10B981' }} />
                        <span style={{ display: 'block', marginTop: '8px', color: '#64748B' }}>
                          Đang tải hàng đợi kiểm duyệt món lạ...
                        </span>
                      </td>
                    </tr>
                  ) : unidentifiedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <Sparkles size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                        <h4 style={{ color: '#1E293B', fontSize: '15px' }}>Không có báo cáo món ăn nào</h4>
                        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>
                          {unidentifiedStatus === 'pending'
                            ? 'Tuyệt vời! Hiện tại không còn món ăn lạ nào đang chờ xử lý.'
                            : 'Không có bản ghi nào phù hợp với bộ lọc đã chọn.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    unidentifiedItems.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name_guess || 'Unidentified Dish'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon size={20} color="#94A3B8" />
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#0F172A', fontSize: '14px', display: 'block' }}>
                            {item.name_guess || '(Không có tên đoán)'}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                            ID: {item._id}
                          </span>
                        </td>
                        <td>
                          {item.reported_by ? (
                            <div>
                              <strong style={{ fontSize: '13px', color: '#334155', display: 'block' }}>
                                {item.reported_by.full_name || 'Người dùng ẩn danh'}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#64748B' }}>
                                {item.reported_by.email}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Không xác định</span>
                          )}
                        </td>
                        <td>
                          {item.status === 'pending' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                              }}>
                              <AlertTriangle size={14} />
                              <span>Chờ xử lý</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                              }}>
                              <CheckCircle2 size={14} />
                              <span>Đã chuẩn hóa</span>
                            </span>
                          )}
                        </td>
                        <td>
                          {item.resolved_food_item ? (
                            <div>
                              <strong style={{ fontSize: '13px', color: '#059669', display: 'block' }}>
                                {item.resolved_food_item.name}
                              </strong>
                              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                                {item.resolved_food_item.category || 'Khác'} • {item.resolved_food_item.calories_per_100g} kcal
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                              Chưa liên kết
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              className="action-btn"
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedUnidentified(item);
                                setIsUnidentifiedDetailOpen(true);
                              }}>
                              <Eye size={16} />
                              <span>Xem</span>
                            </button>

                            {item.status === 'pending' && (
                              <button
                                className="action-btn"
                                title="Chuẩn hóa món ăn"
                                style={{ color: '#10B981', borderColor: '#A7F3D0' }}
                                onClick={() => handleOpenResolveModal(item)}>
                                <Check size={16} />
                                <span>Chuẩn hóa</span>
                              </button>
                            )}

                            <button
                              className="action-btn"
                              title="Xóa báo cáo"
                              onClick={() => {
                                setUnidentifiedToDelete(item);
                                setDeleteUnidentifiedError(null);
                              }}>
                              <Trash2 size={16} color="#DC2626" />
                              <span style={{ color: '#DC2626' }}>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isUnidentifiedLoading && unidentifiedItems.length > 0 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Hiển thị <strong>{(unidentifiedPagination.page - 1) * unidentifiedPagination.limit + 1}</strong> –{' '}
                  <strong>{Math.min(unidentifiedPagination.page * unidentifiedPagination.limit, unidentifiedPagination.total)}</strong> trong
                  tổng số <strong>{unidentifiedPagination.total}</strong> bản ghi
                </div>

                <div className="pagination-actions">
                  <button
                    className="pagination-btn"
                    onClick={() => setUnidentifiedPage((p) => Math.max(p - 1, 1))}
                    disabled={unidentifiedPage <= 1}>
                    <ChevronLeft size={16} />
                    <span>Trước</span>
                  </button>

                  <span className="pagination-pages">
                    Trang <strong>{unidentifiedPage}</strong> / {unidentifiedPagination.totalPages || 1}
                  </span>

                  <button
                    className="pagination-btn"
                    onClick={() => setUnidentifiedPage((p) => p + 1)}
                    disabled={unidentifiedPage >= unidentifiedPagination.totalPages}>
                    <span>Sau</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================================================
          MODAL 1: CHI TIẾT MÓN ĂN (FOOD DETAIL MODAL)
          ===================================================================== */}
      {isDetailModalOpen && selectedFood && (
        <div className="modal-backdrop">
          <div className="modal-card modal-detail-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UtensilsCrossed size={20} color="#10B981" />
                <h3>Chi tiết Thực phẩm & Dinh dưỡng</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {selectedFood.image_url && (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    backgroundColor: '#F1F5F9',
                  }}>
                  <img
                    src={selectedFood.image_url}
                    alt={selectedFood.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <h2 style={{ fontSize: '18px', color: '#0F172A', fontWeight: 700 }}>
                {selectedFood.name}
              </h2>
              {selectedFood.name_en && (
                <p style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic', marginTop: '2px' }}>
                  {selectedFood.name_en}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Danh mục</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>
                    {selectedFood.category || 'Chưa phân loại'}
                  </strong>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#B45309', display: 'block' }}>Calo / 100g</span>
                  <strong style={{ fontSize: '16px', color: '#D97706' }}>
                    {selectedFood.calories_per_100g} kcal
                  </strong>
                </div>
              </div>

              {/* Macro Bar */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Thành phần Dinh dưỡng Macro (trên 100g)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#059669', display: 'block' }}>Chất Đạm (Protein)</span>
                    <strong style={{ fontSize: '16px', color: '#059669' }}>
                      {selectedFood.protein_per_100g !== null && selectedFood.protein_per_100g !== undefined ? `${selectedFood.protein_per_100g}g` : '--'}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#EFF6FF', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#2563EB', display: 'block' }}>Đường bột (Carbs)</span>
                    <strong style={{ fontSize: '16px', color: '#2563EB' }}>
                      {selectedFood.carb_per_100g !== null && selectedFood.carb_per_100g !== undefined ? `${selectedFood.carb_per_100g}g` : '--'}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#F5F3FF', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#7C3AED', display: 'block' }}>Chất béo (Fat)</span>
                    <strong style={{ fontSize: '16px', color: '#7C3AED' }}>
                      {selectedFood.fat_per_100g !== null && selectedFood.fat_per_100g !== undefined ? `${selectedFood.fat_per_100g}g` : '--'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Aliases */}
              {selectedFood.aliases && selectedFood.aliases.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                    Các tên gọi khác (NLP Aliases):
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedFood.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '12px',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}>
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: TẠO / CHỈNH SỬA MÓN ĂN (FOOD FORM MODAL)
          ===================================================================== */}
      {isFormModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formMode === 'create' ? <Plus size={20} color="#10B981" /> : <Edit2 size={20} color="#059669" />}
                <h3>{formMode === 'create' ? 'Thêm Món ăn Mới vào Từ điển' : 'Chỉnh sửa Thông tin Món ăn'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                {formError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Tên món ăn (Tiếng Việt) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: Phở bò tái chín"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Tên tiếng Anh (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: Beef Pho"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Danh mục món
                    </label>
                    <select
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option value="">-- Chọn danh mục --</option>
                      {COMMON_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Calo / 100g (kcal) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: 165"
                      value={formData.calories_per_100g}
                      onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Chất đạm / 100g (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: 31"
                      value={formData.protein_per_100g}
                      onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Đường bột (Carbs) / 100g (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: 0"
                      value={formData.carb_per_100g}
                      onChange={(e) => setFormData({ ...formData, carb_per_100g: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Chất béo (Fat) / 100g (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ví dụ: 3.6"
                      value={formData.fat_per_100g}
                      onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Đường dẫn Hình ảnh (URL)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>

                  {/* Aliases Tag Input */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Tên gọi khác / Bí danh (Aliases)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Nhập tên gọi khác rồi bấm Thêm..."
                        value={newAliasInput}
                        onChange={(e) => setNewAliasInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAlias();
                          }
                        }}
                      />
                      <button type="button" className="btn-secondary" onClick={handleAddAlias}>
                        Thêm
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {formData.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#334155',
                          }}>
                          <Tag size={12} />
                          <span>{alias}</span>
                          <X
                            size={12}
                            style={{ cursor: 'pointer', marginLeft: '2px' }}
                            onClick={() => handleRemoveAlias(idx)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verified Checkbox */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        color: '#1E293B',
                      }}>
                      <input
                        type="checkbox"
                        checked={formData.is_verified}
                        onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                      />
                      <strong>Đã xác thực bởi Admin (Hiển thị nhãn chuẩn hóa)</strong>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsFormModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isFormSubmitting} className="btn-primary">
                  {isFormSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{formMode === 'create' ? 'Tạo món ăn' : 'Lưu thay đổi'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: XÓA MÓN ĂN (FOOD DELETE CONFIRMATION)
          ===================================================================== */}
      {foodToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 style={{ color: '#991B1B' }}>Xác nhận Xóa Món ăn</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setFoodToDelete(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {deleteError && (
                <div className="error-banner" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}
              <p style={{ fontSize: '14px', color: '#334155' }}>
                Bạn có chắc chắn muốn xóa món ăn <strong>"{foodToDelete.name}"</strong> khỏi cơ sở dữ liệu?
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '6px' }}>
                Lưu ý: Món ăn sẽ không thể xóa nếu đang được sử dụng trong nhật ký ăn uống hoặc thực đơn mẫu.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setFoodToDelete(null)}>
                Hủy
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteFood}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}>
                {isDeleting ? 'Đang xóa...' : 'Xóa món ăn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: CHI TIẾT MÓN ĂN CHƯA XÁC ĐỊNH (UNIDENTIFIED DETAIL MODAL)
          ===================================================================== */}
      {isUnidentifiedDetailOpen && selectedUnidentified && (
        <div className="modal-backdrop">
          <div className="modal-card modal-detail-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="#F59E0B" />
                <h3>Chi tiết Báo cáo Món ăn Chưa Xác định</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsUnidentifiedDetailOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {selectedUnidentified.image_url ? (
                <div
                  style={{
                    width: '100%',
                    height: '240px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    backgroundColor: '#F1F5F9',
                  }}>
                  <img
                    src={selectedUnidentified.image_url}
                    alt={selectedUnidentified.name_guess || 'Dish'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                  <ImageIcon size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Báo cáo này không kèm theo hình ảnh.</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Tên phỏng đoán của người dùng:</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A' }}>
                    {selectedUnidentified.name_guess || '(Người dùng không nhập tên)'}
                  </strong>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Người gửi báo cáo:</span>
                  <strong style={{ fontSize: '14px', color: '#334155' }}>
                    {selectedUnidentified.reported_by?.full_name || 'Người dùng ẩn danh'}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>
                    {selectedUnidentified.reported_by?.email}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#F1F5F9', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block' }}>Trạng thái xử lý</span>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        color: selectedUnidentified.status === 'pending' ? '#D97706' : '#059669',
                      }}>
                      {selectedUnidentified.status === 'pending' ? 'Chờ kiểm duyệt' : 'Đã chuẩn hóa'}
                    </strong>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#F1F5F9', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block' }}>Ngày gửi báo cáo</span>
                    <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>
                      {new Date(selectedUnidentified.created_at).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                </div>

                {selectedUnidentified.resolved_food_item && (
                  <div style={{ padding: '12px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    <span style={{ fontSize: '12px', color: '#065F46', display: 'block', fontWeight: 600 }}>
                      Món ăn đã được gán vào từ điển:
                    </span>
                    <strong style={{ fontSize: '15px', color: '#059669' }}>
                      {selectedUnidentified.resolved_food_item.name}
                    </strong>
                    <span style={{ fontSize: '12.5px', color: '#047857', display: 'block', marginTop: '2px' }}>
                      {selectedUnidentified.resolved_food_item.category} • {selectedUnidentified.resolved_food_item.calories_per_100g} kcal/100g
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsUnidentifiedDetailOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: CHUẨN HÓA MÓN ĂN (RESOLVE MODAL WITH OPTION A & B)
          ===================================================================== */}
      {isResolveModalOpen && unidentifiedToResolve && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} color="#10B981" />
                <h3>Chuẩn hóa Món ăn Chưa Xác định</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsResolveModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteResolve}>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                {resolveError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={18} />
                    <span>{resolveError}</span>
                  </div>
                )}

                {/* Brief Snapshot of the submitted dish */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #E2E8F0',
                  }}>
                  {unidentifiedToResolve.image_url ? (
                    <img
                      src={unidentifiedToResolve.image_url}
                      alt="Submitted dish"
                      style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '6px',
                        backgroundColor: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <ImageIcon size={24} color="#94A3B8" />
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block' }}>Tên người dùng dự đoán:</span>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                      {unidentifiedToResolve.name_guess || '(Chưa có tên đoán)'}
                    </strong>
                  </div>
                </div>

                {/* Mode Selector Tabs (Option A vs Option B) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setResolveMode('existing')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      backgroundColor: resolveMode === 'existing' ? '#ECFDF5' : '#FFFFFF',
                      borderColor: resolveMode === 'existing' ? '#10B981' : '#E2E8F0',
                      color: resolveMode === 'existing' ? '#059669' : '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}>
                    <Layers size={16} />
                    <span>Cách 1: Gán món có sẵn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolveMode('new')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      backgroundColor: resolveMode === 'new' ? '#ECFDF5' : '#FFFFFF',
                      borderColor: resolveMode === 'new' ? '#10B981' : '#E2E8F0',
                      color: resolveMode === 'new' ? '#059669' : '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}>
                    <Plus size={16} />
                    <span>Cách 2: Tạo món ăn mới</span>
                  </button>
                </div>

                {/* OPTION A: GÁN MÓN CÓ SẴN */}
                {resolveMode === 'existing' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Tìm kiếm & Chọn món ăn từ Từ điển <span style={{ color: '#DC2626' }}>*</span>
                    </label>

                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Gõ để lọc nhanh theo tên món..."
                        value={existingFoodSearchTerm}
                        onChange={(e) => setExistingFoodSearchTerm(e.target.value)}
                      />
                    </div>

                    <div
                      style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                      }}>
                      {filteredExistingFoods.length === 0 ? (
                        <p style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                          Không tìm thấy món ăn nào khớp với từ khóa.
                        </p>
                      ) : (
                        filteredExistingFoods.map((f) => (
                          <div
                            key={f._id}
                            onClick={() => setSelectedExistingFoodId(f._id)}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: selectedExistingFoodId === f._id ? '#ECFDF5' : 'transparent',
                              borderBottom: '1px solid #F1F5F9',
                            }}>
                            <div>
                              <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{f.name}</strong>
                              <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '6px' }}>
                                ({f.category || 'Khác'})
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D97706' }}>
                              {f.calories_per_100g} kcal
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* OPTION B: TẠO MÓN ĂN MỚI */}
                {resolveMode === 'new' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Tên món ăn mới <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ví dụ: Bánh hỏi thịt nướng Quy Nhơn"
                        value={newFoodForm.name}
                        onChange={(e) => setNewFoodForm({ ...newFoodForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Tên tiếng Anh (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ví dụ: Steamed Rice Noodle with Pork"
                        value={newFoodForm.name_en || ''}
                        onChange={(e) => setNewFoodForm({ ...newFoodForm, name_en: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Danh mục
                      </label>
                      <select
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={newFoodForm.category || ''}
                        onChange={(e) => setNewFoodForm({ ...newFoodForm, category: e.target.value })}>
                        <option value="">-- Chọn danh mục --</option>
                        {COMMON_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Calo / 100g (kcal) <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={newFoodForm.calories_per_100g}
                        onChange={(e) =>
                          setNewFoodForm({
                            ...newFoodForm,
                            calories_per_100g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Chất đạm (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={newFoodForm.protein_per_100g || 0}
                        onChange={(e) =>
                          setNewFoodForm({
                            ...newFoodForm,
                            protein_per_100g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Đường bột (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={newFoodForm.carb_per_100g || 0}
                        onChange={(e) =>
                          setNewFoodForm({
                            ...newFoodForm,
                            carb_per_100g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Chất béo (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={newFoodForm.fat_per_100g || 0}
                        onChange={(e) =>
                          setNewFoodForm({
                            ...newFoodForm,
                            fat_per_100g: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Aliases */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Bí danh nhận diện (Aliases)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '14px' }}
                          placeholder="Thêm bí danh..."
                          value={resolveAliasInput}
                          onChange={(e) => setResolveAliasInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddResolveAlias();
                            }
                          }}
                        />
                        <button type="button" className="btn-secondary" onClick={handleAddResolveAlias}>
                          Thêm
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {newFoodForm.aliases?.map((alias, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              backgroundColor: '#F1F5F9',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#334155',
                            }}>
                            <Tag size={12} />
                            <span>{alias}</span>
                            <X
                              size={12}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveResolveAlias(idx)}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsResolveModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isResolving} className="btn-primary">
                  {isResolving ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Xác nhận chuẩn hóa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 6: XÓA BÁO CÁO MÓN LẠ (UNIDENTIFIED DELETE CONFIRMATION)
          ===================================================================== */}
      {unidentifiedToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 style={{ color: '#991B1B' }}>Xóa Báo cáo Món ăn</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setUnidentifiedToDelete(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {deleteUnidentifiedError && (
                <div className="error-banner" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} />
                  <span>{deleteUnidentifiedError}</span>
                </div>
              )}
              <p style={{ fontSize: '14px', color: '#334155' }}>
                Bạn có chắc chắn muốn xóa bản ghi báo cáo món ăn{' '}
                <strong>"{unidentifiedToDelete.name_guess || 'này'}"</strong>?
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '6px' }}>
                Hành động này chỉ xóa bản ghi trong hàng đợi kiểm duyệt, không ảnh hưởng đến dữ liệu người dùng hay từ điển món ăn.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setUnidentifiedToDelete(null)}>
                Hủy
              </button>
              <button
                disabled={isDeletingUnidentified}
                onClick={handleDeleteUnidentified}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}>
                {isDeletingUnidentified ? 'Đang xóa...' : 'Xóa báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
