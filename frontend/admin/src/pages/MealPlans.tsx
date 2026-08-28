import React, { useState, useEffect, useCallback } from "react";
import { adminMealPlanTemplateService } from "../services/meal_plan.service";
import { adminRecipeService } from "../services/recipe.service";
import {
  MealPlanTemplate,
  MealType,
  CreateMealPlanTemplatePayload,
  UpdateMealPlanTemplatePayload,
} from "../types/meal_plan.types";
import {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  CreateRecipePayload,
  UpdateRecipePayload,
} from "../types/recipe.types";
import {
  Search,
  Filter,
  Eye,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  ChefHat,
  Star,
  ShieldCheck,
  XCircle,
  Layers,
  Sparkles,
} from "lucide-react";

const MEAL_TYPE_LABELS: Record<
  MealType,
  { label: string; color: string; bg: string }
> = {
  breakfast: { label: "Bữa sáng", color: "#D97706", bg: "#FEF3C7" },
  lunch: { label: "Bữa trưa", color: "#059669", bg: "#ECFDF5" },
  dinner: { label: "Bữa tối", color: "#2563EB", bg: "#EFF6FF" },
  snack: { label: "Bữa phụ", color: "#7C3AED", bg: "#F5F3FF" },
};

export const MealPlans: React.FC = () => {
  // Tab State: 'templates' | 'recipes'
  const [activeTab, setActiveTab] = useState<"templates" | "recipes">(
    "templates",
  );

  // Common Feedback State
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // =========================================================================
  // TAB 1: MEAL PLAN TEMPLATES STATE
  // =========================================================================
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([]);
  const [templatePagination, setTemplatePagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedTemplateSearch, setDebouncedTemplateSearch] = useState("");
  const [templatePage, setTemplatePage] = useState(1);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Template Modals
  const [selectedTemplate, setSelectedTemplate] =
    useState<MealPlanTemplate | null>(null);
  const [isTemplateDetailOpen, setIsTemplateDetailOpen] = useState(false);
  const [isTemplateDetailLoading, setIsTemplateDetailLoading] = useState(false);

  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [templateFormMode, setTemplateFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateFormData, setTemplateFormData] = useState<{
    name: string;
    description: string;
    items: { meal_type: MealType; recipe_id: string }[];
  }>({
    name: "",
    description: "",
    items: [],
  });
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);
  const [templateFormError, setTemplateFormError] = useState<string | null>(
    null,
  );

  // Item Selector helper inside Template Form
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("breakfast");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");

  // Delete Template
  const [templateToDelete, setTemplateToDelete] =
    useState<MealPlanTemplate | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [deleteTemplateError, setDeleteTemplateError] = useState<string | null>(
    null,
  );

  // =========================================================================
  // TAB 2: RECIPES STATE
  // =========================================================================
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeOptions, setRecipeOptions] = useState<Recipe[]>([]); // For template dropdown
  const [recipePagination, setRecipePagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [recipeSearch, setRecipeSearch] = useState("");
  const [debouncedRecipeSearch, setDebouncedRecipeSearch] = useState("");
  const [recipeSourceType, setRecipeSourceType] = useState("all");
  const [recipeStatus, setRecipeStatus] = useState("all");
  const [recipePage, setRecipePage] = useState(1);
  const [isRecipeLoading, setIsRecipeLoading] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  // Recipe Modals
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [isRecipeDetailLoading, setIsRecipeDetailLoading] = useState(false);

  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [recipeFormMode, setRecipeFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeFormData, setRecipeFormData] = useState<{
    title: string;
    description: string;
    image_url: string;
    prep_time_minutes: string;
    cook_time_minutes: string;
    servings: string;
    calories_per_serving: string;
    protein_g: string;
    carb_g: string;
    fat_g: string;
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
  }>({
    title: "",
    description: "",
    image_url: "",
    prep_time_minutes: "",
    cook_time_minutes: "",
    servings: "1",
    calories_per_serving: "",
    protein_g: "",
    carb_g: "",
    fat_g: "",
    ingredients: [],
    steps: [],
  });
  const [newIngredient, setNewIngredient] = useState<RecipeIngredient>({
    ingredient_name: "",
    quantity: null,
    unit: "",
  });
  const [newStepInstruction, setNewStepInstruction] = useState("");
  const [isRecipeSubmitting, setIsRecipeSubmitting] = useState(false);
  const [recipeFormError, setRecipeFormError] = useState<string | null>(null);

  // Delete Recipe
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [deleteRecipeError, setDeleteRecipeError] = useState<string | null>(
    null,
  );

  // Debounce Template Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTemplateSearch(templateSearch);
      setTemplatePage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [templateSearch]);

  // Debounce Recipe Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRecipeSearch(recipeSearch);
      setRecipePage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [recipeSearch]);

  // Fetch Templates
  const fetchTemplates = useCallback(async () => {
    setIsTemplateLoading(true);
    setTemplateError(null);
    try {
      const res = await adminMealPlanTemplateService.getTemplates({
        page: templatePage,
        limit: 10,
        search: debouncedTemplateSearch,
      });
      if (res.success && res.data) {
        setTemplates(res.data.templates);
        setTemplatePagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách thực đơn mẫu:", err);
      setTemplateError(
        err.response?.data?.message || "Không thể tải danh sách thực đơn mẫu.",
      );
    } finally {
      setIsTemplateLoading(false);
    }
  }, [templatePage, debouncedTemplateSearch]);

  // Fetch Recipes
  const fetchRecipes = useCallback(async () => {
    setIsRecipeLoading(true);
    setRecipeError(null);
    try {
      const res = await adminRecipeService.getRecipes({
        page: recipePage,
        limit: 10,
        search: debouncedRecipeSearch,
        source_type: recipeSourceType,
        status: recipeStatus,
      });
      if (res.success && res.data) {
        setRecipes(res.data.recipes);
        setRecipePagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách công thức:", err);
      setRecipeError(
        err.response?.data?.message ||
          "Không thể tải danh sách công thức món ăn.",
      );
    } finally {
      setIsRecipeLoading(false);
    }
  }, [recipePage, debouncedRecipeSearch, recipeSourceType, recipeStatus]);

  // Fetch all recipes for dropdown picker in template form
  const fetchAllRecipesForPicker = async () => {
    try {
      const res = await adminRecipeService.getRecipes({
        limit: 100,
        status: "approved",
      });
      if (res.success && res.data) {
        setRecipeOptions(res.data.recipes);
        if (res.data.recipes.length > 0 && !selectedRecipeId) {
          setSelectedRecipeId(res.data.recipes[0]._id);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục công thức món ăn:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "templates") {
      fetchTemplates();
      fetchAllRecipesForPicker();
    } else {
      fetchRecipes();
    }
  }, [activeTab, fetchTemplates, fetchRecipes]);

  // =========================================================================
  // TEMPLATE HANDLERS
  // =========================================================================
  const handleOpenTemplateDetail = async (templateId: string) => {
    setIsTemplateDetailOpen(true);
    setIsTemplateDetailLoading(true);
    try {
      const res =
        await adminMealPlanTemplateService.getTemplateById(templateId);
      if (res.success && res.data.template) {
        setSelectedTemplate(res.data.template);
      }
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Không thể lấy thông tin chi tiết thực đơn mẫu.",
      );
      setIsTemplateDetailOpen(false);
    } finally {
      setIsTemplateDetailLoading(false);
    }
  };

  const handleOpenCreateTemplateModal = () => {
    setTemplateFormMode("create");
    setEditingTemplateId(null);
    setTemplateFormData({
      name: "",
      description: "",
      items: [],
    });
    setTemplateFormError(null);
    setIsTemplateFormOpen(true);
    fetchAllRecipesForPicker();
  };

  const handleOpenEditTemplateModal = (template: MealPlanTemplate) => {
    setTemplateFormMode("edit");
    setEditingTemplateId(template._id);
    setTemplateFormData({
      name: template.name || "",
      description: template.description || "",
      items: template.items
        ? template.items.map((it) => ({
            meal_type: it.meal_type,
            recipe_id:
              typeof it.recipe_id === "object"
                ? (it.recipe_id as Recipe)._id
                : it.recipe_id,
          }))
        : [],
    });
    setTemplateFormError(null);
    setIsTemplateFormOpen(true);
    fetchAllRecipesForPicker();
  };

  const handleAddItemToTemplate = () => {
    if (!selectedRecipeId) {
      alert("Vui lòng chọn một công thức món ăn.");
      return;
    }
    setTemplateFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { meal_type: selectedMealType, recipe_id: selectedRecipeId },
      ],
    }));
  };

  const handleRemoveItemFromTemplate = (indexToRemove: number) => {
    setTemplateFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleTemplateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateFormError(null);

    if (!templateFormData.name.trim()) {
      setTemplateFormError("Vui lòng nhập tên thực đơn mẫu.");
      return;
    }

    const payload: CreateMealPlanTemplatePayload = {
      name: templateFormData.name.trim(),
      description: templateFormData.description.trim()
        ? templateFormData.description.trim()
        : null,
      items: templateFormData.items,
    };

    setIsTemplateSubmitting(true);
    try {
      if (templateFormMode === "create") {
        const res = await adminMealPlanTemplateService.createTemplate(payload);
        if (res.success) {
          setSuccessToast("Đã tạo thực đơn mẫu mới thành công!");
          setTimeout(() => setSuccessToast(null), 3000);
          setIsTemplateFormOpen(false);
          fetchTemplates();
        }
      } else if (templateFormMode === "edit" && editingTemplateId) {
        const res = await adminMealPlanTemplateService.updateTemplate(
          editingTemplateId,
          payload as UpdateMealPlanTemplatePayload,
        );
        if (res.success) {
          setSuccessToast("Đã cập nhật thực đơn mẫu thành công!");
          setTimeout(() => setSuccessToast(null), 3000);
          setIsTemplateFormOpen(false);
          fetchTemplates();
        }
      }
    } catch (err: any) {
      setTemplateFormError(
        err.response?.data?.message || "Không thể lưu thực đơn mẫu.",
      );
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeletingTemplate(true);
    setDeleteTemplateError(null);
    try {
      const res = await adminMealPlanTemplateService.deleteTemplate(
        templateToDelete._id,
      );
      if (res.success) {
        setSuccessToast("Đã xóa thực đơn mẫu thành công!");
        setTimeout(() => setSuccessToast(null), 3000);
        setTemplateToDelete(null);
        fetchTemplates();
      }
    } catch (err: any) {
      setDeleteTemplateError(
        err.response?.data?.message || "Không thể xóa thực đơn mẫu.",
      );
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // =========================================================================
  // RECIPE HANDLERS
  // =========================================================================
  const handleOpenRecipeDetail = async (recipeId: string) => {
    setIsRecipeDetailOpen(true);
    setIsRecipeDetailLoading(true);
    try {
      const res = await adminRecipeService.getRecipeById(recipeId);
      if (res.success && res.data.recipe) {
        setSelectedRecipe(res.data.recipe);
      }
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Không thể lấy thông tin chi tiết công thức.",
      );
      setIsRecipeDetailOpen(false);
    } finally {
      setIsRecipeDetailLoading(false);
    }
  };

  const handleOpenCreateRecipeModal = () => {
    setRecipeFormMode("create");
    setEditingRecipeId(null);
    setRecipeFormData({
      title: "",
      description: "",
      image_url: "",
      prep_time_minutes: "",
      cook_time_minutes: "",
      servings: "1",
      calories_per_serving: "",
      protein_g: "",
      carb_g: "",
      fat_g: "",
      ingredients: [],
      steps: [],
    });
    setNewIngredient({ ingredient_name: "", quantity: null, unit: "" });
    setNewStepInstruction("");
    setRecipeFormError(null);
    setIsRecipeFormOpen(true);
  };

  const handleOpenEditRecipeModal = (recipe: Recipe) => {
    setRecipeFormMode("edit");
    setEditingRecipeId(recipe._id);
    setRecipeFormData({
      title: recipe.title || "",
      description: recipe.description || "",
      image_url: recipe.image_url || "",
      prep_time_minutes:
        recipe.prep_time_minutes !== undefined &&
        recipe.prep_time_minutes !== null
          ? recipe.prep_time_minutes.toString()
          : "",
      cook_time_minutes:
        recipe.cook_time_minutes !== undefined &&
        recipe.cook_time_minutes !== null
          ? recipe.cook_time_minutes.toString()
          : "",
      servings:
        recipe.servings !== undefined && recipe.servings !== null
          ? recipe.servings.toString()
          : "1",
      calories_per_serving:
        recipe.calories_per_serving !== undefined &&
        recipe.calories_per_serving !== null
          ? recipe.calories_per_serving.toString()
          : "",
      protein_g:
        recipe.protein_g !== undefined && recipe.protein_g !== null
          ? recipe.protein_g.toString()
          : "",
      carb_g:
        recipe.carb_g !== undefined && recipe.carb_g !== null
          ? recipe.carb_g.toString()
          : "",
      fat_g:
        recipe.fat_g !== undefined && recipe.fat_g !== null
          ? recipe.fat_g.toString()
          : "",
      ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
      steps: recipe.steps ? [...recipe.steps] : [],
    });
    setNewIngredient({ ingredient_name: "", quantity: null, unit: "" });
    setNewStepInstruction("");
    setRecipeFormError(null);
    setIsRecipeFormOpen(true);
  };

  const handleAddIngredient = () => {
    if (!newIngredient.ingredient_name.trim()) {
      alert("Vui lòng nhập tên nguyên liệu.");
      return;
    }
    setRecipeFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient_name: newIngredient.ingredient_name.trim(),
          quantity:
            newIngredient.quantity !== null &&
            newIngredient.quantity !== undefined &&
            newIngredient.quantity !== ("" as any)
              ? Number(newIngredient.quantity)
              : null,
          unit: newIngredient.unit?.trim() || null,
        },
      ],
    }));
    setNewIngredient({ ingredient_name: "", quantity: null, unit: "" });
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setRecipeFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAddStep = () => {
    if (!newStepInstruction.trim()) {
      alert("Vui lòng nhập nội dung hướng dẫn cho bước.");
      return;
    }
    setRecipeFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_number: prev.steps.length + 1,
          instruction: newStepInstruction.trim(),
        },
      ],
    }));
    setNewStepInstruction("");
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setRecipeFormData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, idx) => idx !== indexToRemove)
        .map((st, idx) => ({ ...st, step_number: idx + 1 })),
    }));
  };

  const handleRecipeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeFormError(null);

    if (!recipeFormData.title.trim()) {
      setRecipeFormError("Vui lòng nhập tên công thức món ăn.");
      return;
    }

    if (
      !recipeFormData.servings ||
      isNaN(Number(recipeFormData.servings)) ||
      Number(recipeFormData.servings) <= 0
    ) {
      setRecipeFormError("Khẩu phần ăn (servings) phải là số > 0.");
      return;
    }

    const payload: CreateRecipePayload = {
      title: recipeFormData.title.trim(),
      description: recipeFormData.description.trim()
        ? recipeFormData.description.trim()
        : null,
      image_url: recipeFormData.image_url.trim()
        ? recipeFormData.image_url.trim()
        : null,
      prep_time_minutes:
        recipeFormData.prep_time_minutes !== ""
          ? Number(recipeFormData.prep_time_minutes)
          : null,
      cook_time_minutes:
        recipeFormData.cook_time_minutes !== ""
          ? Number(recipeFormData.cook_time_minutes)
          : null,
      servings: Number(recipeFormData.servings),
      calories_per_serving:
        recipeFormData.calories_per_serving !== ""
          ? Number(recipeFormData.calories_per_serving)
          : null,
      protein_g:
        recipeFormData.protein_g !== ""
          ? Number(recipeFormData.protein_g)
          : null,
      carb_g:
        recipeFormData.carb_g !== "" ? Number(recipeFormData.carb_g) : null,
      fat_g: recipeFormData.fat_g !== "" ? Number(recipeFormData.fat_g) : null,
      ingredients: recipeFormData.ingredients,
      steps: recipeFormData.steps,
    };

    setIsRecipeSubmitting(true);
    try {
      if (recipeFormMode === "create") {
        const res = await adminRecipeService.createRecipe(payload);
        if (res.success) {
          setSuccessToast("Đã tạo công thức hệ thống mới thành công!");
          setTimeout(() => setSuccessToast(null), 3000);
          setIsRecipeFormOpen(false);
          fetchRecipes();
        }
      } else if (recipeFormMode === "edit" && editingRecipeId) {
        const res = await adminRecipeService.updateRecipe(
          editingRecipeId,
          payload as UpdateRecipePayload,
        );
        if (res.success) {
          setSuccessToast("Đã cập nhật công thức thành công!");
          setTimeout(() => setSuccessToast(null), 3000);
          setIsRecipeFormOpen(false);
          fetchRecipes();
        }
      }
    } catch (err: any) {
      setRecipeFormError(
        err.response?.data?.message || "Không thể lưu công thức.",
      );
    } finally {
      setIsRecipeSubmitting(false);
    }
  };

  const handleUpdateRecipeStatus = async (
    recipeId: string,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      const res = await adminRecipeService.updateRecipeStatus(
        recipeId,
        newStatus,
      );
      if (res.success) {
        setSuccessToast(
          `Đã ${newStatus === "approved" ? "phê duyệt" : "từ chối"} công thức thành công!`,
        );
        setTimeout(() => setSuccessToast(null), 3000);
        fetchRecipes();
      }
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái công thức.",
      );
    }
  };

  const handleConfirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    setIsDeletingRecipe(true);
    setDeleteRecipeError(null);
    try {
      const res = await adminRecipeService.deleteRecipe(recipeToDelete._id);
      if (res.success) {
        setSuccessToast("Đã xóa công thức thành công!");
        setTimeout(() => setSuccessToast(null), 3000);
        setRecipeToDelete(null);
        fetchRecipes();
      }
    } catch (err: any) {
      setDeleteRecipeError(
        err.response?.data?.message || "Không thể xóa công thức.",
      );
    } finally {
      setIsDeletingRecipe(false);
    }
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRecipeTitle = (recipeIdOrObj: string | Recipe) => {
    if (typeof recipeIdOrObj === "object" && recipeIdOrObj !== null) {
      return recipeIdOrObj.title;
    }
    const found = recipeOptions.find((r) => r._id === recipeIdOrObj);
    return found ? found.title : `Công thức #${recipeIdOrObj.slice(-6)}`;
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

      {/* Main Header with Navigation Tabs */}
      <div className="page-header-row" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-heading">Kế hoạch Bữa ăn & Công thức</h1>
          <p className="page-subheading">
            Quản trị các gói thực đơn mẫu (Meal Plan Templates) và từ điển công
            thức nấu ăn chuẩn hóa (Master Recipes).
          </p>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              onClick={() => setActiveTab("templates")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                backgroundColor:
                  activeTab === "templates" ? "#10B981" : "#FFFFFF",
                color: activeTab === "templates" ? "#FFFFFF" : "#475569",
                borderColor: activeTab === "templates" ? "#10B981" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              <Layers size={16} />
              <span>Thực đơn mẫu (Templates)</span>
            </button>

            <button
              onClick={() => setActiveTab("recipes")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                backgroundColor:
                  activeTab === "recipes" ? "#10B981" : "#FFFFFF",
                color: activeTab === "recipes" ? "#FFFFFF" : "#475569",
                borderColor: activeTab === "recipes" ? "#10B981" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              <BookOpen size={16} />
              <span>Công thức món ăn (Recipes)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          {activeTab === "templates" ? (
            <>
              <button
                className="btn-secondary"
                onClick={fetchTemplates}
                disabled={isTemplateLoading}
                title="Làm mới"
              >
                <RefreshCw
                  size={16}
                  className={isTemplateLoading ? "spinner" : ""}
                />
                <span>Làm mới</span>
              </button>
              <button
                className="btn-primary"
                onClick={handleOpenCreateTemplateModal}
              >
                <Plus size={18} />
                <span>Thêm thực đơn mẫu</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={fetchRecipes}
                disabled={isRecipeLoading}
                title="Làm mới"
              >
                <RefreshCw
                  size={16}
                  className={isRecipeLoading ? "spinner" : ""}
                />
                <span>Làm mới</span>
              </button>
              <button
                className="btn-primary"
                onClick={handleOpenCreateRecipeModal}
              >
                <Plus size={18} />
                <span>Thêm công thức</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: THỰC ĐƠN MẪU (MEAL PLAN TEMPLATES)
          ===================================================================== */}
      {activeTab === "templates" && (
        <>
          {/* Toolbar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên thực đơn mẫu..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
              {templateSearch && (
                <button
                  className="clear-search-btn"
                  onClick={() => setTemplateSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-card">
            {templateError && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{templateError}</span>
              </div>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TÊN THỰC ĐƠN MẪU</th>
                    <th>MÔ TẢ</th>
                    <th>SỐ MÓN ĂN</th>
                    <th>NGƯỜI TẠO (ADMIN)</th>
                    <th style={{ textAlign: "right" }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {isTemplateLoading ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="table-loading">
                          <Loader2 size={32} className="spinner" />
                          <p>Đang tải danh sách thực đơn mẫu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="table-empty">
                          <Layers size={48} color="#CBD5E1" />
                          <h3>Chưa có thực đơn mẫu nào</h3>
                          <p>
                            Nhấn "+ Thêm thực đơn mẫu" để bắt đầu xây dựng các
                            gói dinh dưỡng chuẩn.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    templates.map((tpl) => (
                      <tr key={tpl._id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                backgroundColor: "#ECFDF5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Sparkles size={18} color="#10B981" />
                            </div>
                            <div>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: "#0F172A",
                                  fontSize: "14.5px",
                                }}
                              >
                                {tpl.name}
                              </span>
                              <div
                                style={{ fontSize: "11px", color: "#94A3B8" }}
                              >
                                ID: {tpl._id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#475569",
                              maxWidth: "300px",
                              display: "inline-block",
                            }}
                          >
                            {tpl.description || "--"}
                          </span>
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: "#EFF6FF",
                              color: "#1E40AF",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: 700,
                              fontSize: "12.5px",
                            }}
                          >
                            <Utensils size={13} />
                            <span>
                              {tpl.item_count || tpl.items?.length || 0} món
                            </span>
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: "13px" }}>
                            {typeof tpl.created_by_admin_id === "object" &&
                            tpl.created_by_admin_id !== null ? (
                              <>
                                <strong style={{ color: "#0F172A" }}>
                                  {tpl.created_by_admin_id.full_name || "Admin"}
                                </strong>
                                <div
                                  style={{
                                    fontSize: "11.5px",
                                    color: "#64748B",
                                  }}
                                >
                                  {tpl.created_by_admin_id.email}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: "#64748B" }}>
                                Admin ID:{" "}
                                {String(tpl.created_by_admin_id).slice(-6)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons-cell">
                            <button
                              className="action-btn action-btn-view"
                              onClick={() => handleOpenTemplateDetail(tpl._id)}
                              title="Xem chi tiết thực đơn"
                            >
                              <Eye size={14} />
                              <span>Xem</span>
                            </button>
                            <button
                              className="action-btn action-btn-role"
                              onClick={() => handleOpenEditTemplateModal(tpl)}
                              title="Chỉnh sửa thực đơn"
                            >
                              <Edit2 size={14} />
                              <span>Sửa</span>
                            </button>
                            <button
                              className="action-btn"
                              style={{
                                backgroundColor: "#FEF2F2",
                                borderColor: "#FECACA",
                                color: "#DC2626",
                              }}
                              onClick={() => {
                                setTemplateToDelete(tpl);
                                setDeleteTemplateError(null);
                              }}
                              title="Xóa thực đơn"
                            >
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

            {/* Pagination */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Hiển thị <strong>{templates.length}</strong> /{" "}
                <strong>{templatePagination.total}</strong> thực đơn mẫu
              </div>
              <div className="pagination-actions">
                <button
                  className="pagination-btn"
                  disabled={templatePage <= 1 || isTemplateLoading}
                  onClick={() =>
                    setTemplatePage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <ChevronLeft size={16} />
                  <span>Trước</span>
                </button>
                <span className="pagination-pages">
                  Trang <strong>{templatePagination.page || 1}</strong> /{" "}
                  {templatePagination.totalPages || 1}
                </span>
                <button
                  className="pagination-btn"
                  disabled={
                    templatePage >= templatePagination.totalPages ||
                    isTemplateLoading
                  }
                  onClick={() =>
                    setTemplatePage((prev) =>
                      Math.min(prev + 1, templatePagination.totalPages),
                    )
                  }
                >
                  <span>Sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          TAB 2: CÔNG THỨC MÓN ĂN (RECIPES)
          ===================================================================== */}
      {activeTab === "recipes" && (
        <>
          {/* Toolbar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên công thức món ăn..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
              />
              {recipeSearch && (
                <button
                  className="clear-search-btn"
                  onClick={() => setRecipeSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Source Type Filter */}
            <div className="role-filter-group">
              <Filter size={16} className="filter-icon" />
              <select
                className="role-select"
                value={recipeSourceType}
                onChange={(e) => {
                  setRecipeSourceType(e.target.value);
                  setRecipePage(1);
                }}
              >
                <option value="all">Tất cả nguồn</option>
                <option value="system">Hệ thống (System)</option>
                <option value="community">Cộng đồng (Community)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="role-filter-group">
              <ShieldCheck size={16} className="filter-icon" />
              <select
                className="role-select"
                value={recipeStatus}
                onChange={(e) => {
                  setRecipeStatus(e.target.value);
                  setRecipePage(1);
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="pending">Chờ duyệt</option>
                <option value="rejected">Bị từ chối</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-card">
            {recipeError && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{recipeError}</span>
              </div>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CÔNG THỨC MÓN ĂN</th>
                    <th>NGUỒN</th>
                    <th>TRẠNG THÁI</th>
                    <th>CALO / PHẦN</th>
                    <th>ĐẠM (P)</th>
                    <th>CARB (C)</th>
                    <th>FAT (F)</th>
                    <th>ĐÁNH GIÁ</th>
                    <th>NGÀY TẠO</th>
                    <th style={{ textAlign: "right" }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {isRecipeLoading ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="table-loading">
                          <Loader2 size={32} className="spinner" />
                          <p>Đang tải danh sách công thức món ăn...</p>
                        </div>
                      </td>
                    </tr>
                  ) : recipes.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="table-empty">
                          <BookOpen size={48} color="#CBD5E1" />
                          <h3>Không tìm thấy công thức nào</h3>
                          <p>
                            Thử thay đổi từ khóa hoặc bộ lọc nguồn/trạng thái.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recipes.map((rec) => (
                      <tr key={rec._id}>
                        {/* Title & Image */}
                        <td>
                          <div className="user-cell">
                            <div
                              className="user-cell-avatar"
                              style={{
                                backgroundColor: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                              }}
                            >
                              {rec.image_url ? (
                                <img src={rec.image_url} alt={rec.title} />
                              ) : (
                                <ChefHat size={18} color="#10B981" />
                              )}
                            </div>
                            <div className="user-cell-info">
                              <span className="user-cell-name">
                                {rec.title}
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  fontSize: "11.5px",
                                  color: "#64748B",
                                  marginTop: "2px",
                                }}
                              >
                                <span>
                                  Khẩu phần: <strong>{rec.servings}</strong>
                                </span>
                                {(rec.prep_time_minutes ||
                                  rec.cook_time_minutes) && (
                                  <span>
                                    • Nấu:{" "}
                                    <strong>
                                      {(rec.prep_time_minutes || 0) +
                                        (rec.cook_time_minutes || 0)}
                                      p
                                    </strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Source Type */}
                        <td>
                          {rec.source_type === "system" ? (
                            <span className="role-pill role-pill-admin">
                              Hệ thống
                            </span>
                          ) : (
                            <span className="role-pill role-pill-user">
                              Cộng đồng
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          {rec.status === "approved" && (
                            <span
                              className="role-pill role-pill-admin"
                              style={{ gap: "4px" }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Đã duyệt</span>
                            </span>
                          )}
                          {rec.status === "pending" && (
                            <span
                              className="role-pill"
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#D97706",
                                border: "1px solid #FDE68A",
                                gap: "4px",
                              }}
                            >
                              <Clock size={13} />
                              <span>Chờ duyệt</span>
                            </span>
                          )}
                          {rec.status === "rejected" && (
                            <span
                              className="role-pill"
                              style={{
                                backgroundColor: "#FEF2F2",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                gap: "4px",
                              }}
                            >
                              <XCircle size={13} />
                              <span>Từ chối</span>
                            </span>
                          )}
                        </td>

                        {/* Calories */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 700,
                              color: "#D97706",
                            }}
                          >
                            <Flame size={15} color="#F59E0B" />
                            <span>{rec.calories_per_serving ?? "--"}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#94A3B8",
                                fontWeight: 500,
                              }}
                            >
                              kcal
                            </span>
                          </div>
                        </td>

                        {/* Protein */}
                        <td>
                          <span style={{ fontWeight: 600, color: "#059669" }}>
                            {rec.protein_g !== null &&
                            rec.protein_g !== undefined
                              ? `${rec.protein_g}g`
                              : "--"}
                          </span>
                        </td>

                        {/* Carb */}
                        <td>
                          <span style={{ fontWeight: 600, color: "#2563EB" }}>
                            {rec.carb_g !== null && rec.carb_g !== undefined
                              ? `${rec.carb_g}g`
                              : "--"}
                          </span>
                        </td>

                        {/* Fat */}
                        <td>
                          <span style={{ fontWeight: 600, color: "#7C3AED" }}>
                            {rec.fat_g !== null && rec.fat_g !== undefined
                              ? `${rec.fat_g}g`
                              : "--"}
                          </span>
                        </td>

                        {/* Rating */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#D97706",
                            }}
                          >
                            <Star size={14} fill="#F59E0B" color="#F59E0B" />
                            <span>
                              {rec.avg_rating
                                ? rec.avg_rating.toFixed(1)
                                : "5.0"}
                            </span>
                            <span
                              style={{ fontSize: "11px", color: "#94A3B8" }}
                            >
                              ({rec.comment_count || 0})
                            </span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td style={{ fontSize: "12.5px", color: "#64748B" }}>
                          {formatDate(rec.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons-cell">
                            {rec.source_type === "community" &&
                              rec.status === "pending" && (
                                <>
                                  <button
                                    className="action-btn"
                                    style={{
                                      backgroundColor: "#ECFDF5",
                                      borderColor: "#A7F3D0",
                                      color: "#059669",
                                    }}
                                    onClick={() =>
                                      handleUpdateRecipeStatus(
                                        rec._id,
                                        "approved",
                                      )
                                    }
                                    title="Duyệt công thức"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Duyệt</span>
                                  </button>
                                  <button
                                    className="action-btn"
                                    style={{
                                      backgroundColor: "#FEF2F2",
                                      borderColor: "#FECACA",
                                      color: "#DC2626",
                                    }}
                                    onClick={() =>
                                      handleUpdateRecipeStatus(
                                        rec._id,
                                        "rejected",
                                      )
                                    }
                                    title="Từ chối công thức"
                                  >
                                    <XCircle size={14} />
                                    <span>Từ chối</span>
                                  </button>
                                </>
                              )}

                            <button
                              className="action-btn action-btn-view"
                              onClick={() => handleOpenRecipeDetail(rec._id)}
                              title="Xem chi tiết công thức"
                            >
                              <Eye size={14} />
                              <span>Xem</span>
                            </button>
                            <button
                              className="action-btn action-btn-role"
                              onClick={() => handleOpenEditRecipeModal(rec)}
                              title="Chỉnh sửa công thức"
                            >
                              <Edit2 size={14} />
                              <span>Sửa</span>
                            </button>
                            <button
                              className="action-btn"
                              style={{
                                backgroundColor: "#FEF2F2",
                                borderColor: "#FECACA",
                                color: "#DC2626",
                              }}
                              onClick={() => {
                                setRecipeToDelete(rec);
                                setDeleteRecipeError(null);
                              }}
                              title="Xóa công thức"
                            >
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

            {/* Pagination */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Hiển thị <strong>{recipes.length}</strong> /{" "}
                <strong>{recipePagination.total}</strong> công thức
              </div>
              <div className="pagination-actions">
                <button
                  className="pagination-btn"
                  disabled={recipePage <= 1 || isRecipeLoading}
                  onClick={() => setRecipePage((prev) => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Trước</span>
                </button>
                <span className="pagination-pages">
                  Trang <strong>{recipePagination.page || 1}</strong> /{" "}
                  {recipePagination.totalPages || 1}
                </span>
                <button
                  className="pagination-btn"
                  disabled={
                    recipePage >= recipePagination.totalPages || isRecipeLoading
                  }
                  onClick={() =>
                    setRecipePage((prev) =>
                      Math.min(prev + 1, recipePagination.totalPages),
                    )
                  }
                >
                  <span>Sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          MODALS CHO THỰC ĐƠN MẪU (MEAL PLAN TEMPLATES)
          ===================================================================== */}
      {/* 1. Template Detail Modal */}
      {isTemplateDetailOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsTemplateDetailOpen(false)}
        >
          <div
            className="modal-card modal-detail-card"
            style={{ maxWidth: "650px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Chi tiết Thực đơn Dinh dưỡng mẫu</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsTemplateDetailOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {isTemplateDetailLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <Loader2 size={32} className="spinner" />
                  <p style={{ marginTop: "8px", color: "#64748B" }}>
                    Đang tải thông tin thực đơn...
                  </p>
                </div>
              ) : selectedTemplate ? (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      {selectedTemplate.name}
                    </h2>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#475569",
                        marginTop: "4px",
                      }}
                    >
                      {selectedTemplate.description ||
                        "Chưa có mô tả cho thực đơn này."}
                    </p>
                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "10px" }}
                    >
                      <span className="id-badge">
                        ID: {selectedTemplate._id}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          backgroundColor: "#EFF6FF",
                          color: "#1E40AF",
                          padding: "3px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {selectedTemplate.items?.length || 0} món ăn
                      </span>
                    </div>
                  </div>

                  {/* Grouped by Meal Types */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {(
                      ["breakfast", "lunch", "dinner", "snack"] as MealType[]
                    ).map((mType) => {
                      const itemsInMeal =
                        selectedTemplate.items?.filter(
                          (it) => it.meal_type === mType,
                        ) || [];
                      const styleInfo = MEAL_TYPE_LABELS[mType];

                      return (
                        <div
                          key={mType}
                          style={{
                            border: "1px solid #E2E8F0",
                            borderRadius: "var(--radius-md)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: styleInfo.bg,
                              color: styleInfo.color,
                              padding: "10px 16px",
                              fontWeight: 800,
                              fontSize: "13.5px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{styleInfo.label}</span>
                            <span style={{ fontSize: "12px", fontWeight: 600 }}>
                              {itemsInMeal.length} món
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "12px 16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {itemsInMeal.length === 0 ? (
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  color: "#94A3B8",
                                  fontStyle: "italic",
                                }}
                              >
                                Chưa có món ăn nào cho bữa này.
                              </span>
                            ) : (
                              itemsInMeal.map((item, idx) => {
                                const recipeData =
                                  typeof item.recipe_id === "object"
                                    ? (item.recipe_id as Recipe)
                                    : null;
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 12px",
                                      backgroundColor: "#F8FAFC",
                                      borderRadius: "6px",
                                      border: "1px solid #F1F5F9",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                      }}
                                    >
                                      {recipeData?.image_url ? (
                                        <img
                                          src={recipeData.image_url}
                                          alt={recipeData.title}
                                          style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "6px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : (
                                        <ChefHat size={18} color="#10B981" />
                                      )}
                                      <div>
                                        <strong
                                          style={{
                                            fontSize: "13.5px",
                                            color: "#0F172A",
                                          }}
                                        >
                                          {recipeData
                                            ? recipeData.title
                                            : `Món ăn #${String(item.recipe_id).slice(-6)}`}
                                        </strong>
                                        {recipeData?.calories_per_serving && (
                                          <div
                                            style={{
                                              fontSize: "11.5px",
                                              color: "#D97706",
                                            }}
                                          >
                                            🔥 {recipeData.calories_per_serving}{" "}
                                            kcal • P:{" "}
                                            {recipeData.protein_g || 0}g • C:{" "}
                                            {recipeData.carb_g || 0}g • F:{" "}
                                            {recipeData.fat_g || 0}g
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsTemplateDetailOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Create / Edit Template Modal */}
      {isTemplateFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsTemplateFormOpen(false)}
        >
          <div
            className="modal-card modal-detail-card"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {templateFormMode === "create"
                  ? "Tạo Thực Đơn Mẫu Mới"
                  : "Chỉnh Sửa Thực Đơn Mẫu"}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsTemplateFormOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTemplateFormSubmit}>
              <div className="modal-body" style={{ maxHeight: "75vh" }}>
                {templateFormError && (
                  <div className="modal-error-banner">
                    <AlertCircle size={18} />
                    <span>{templateFormError}</span>
                  </div>
                )}

                <div style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "6px",
                    }}
                  >
                    Tên thực đơn mẫu <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "14px" }}
                    placeholder="VD: Thực đơn Eat Clean 1500 kcal Giảm Mỡ"
                    value={templateFormData.name}
                    onChange={(e) =>
                      setTemplateFormData({
                        ...templateFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "6px",
                    }}
                  >
                    Mô tả thực đơn
                  </label>
                  <textarea
                    className="form-input"
                    style={{
                      padding: "10px 14px",
                      height: "70px",
                      resize: "none",
                    }}
                    placeholder="Mục tiêu dinh dưỡng, đối tượng người dùng phù hợp..."
                    value={templateFormData.description}
                    onChange={(e) =>
                      setTemplateFormData({
                        ...templateFormData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Sub-item Picker: Meal Type & Recipe */}
                <div
                  style={{
                    borderTop: "1px dashed #CBD5E1",
                    paddingTop: "14px",
                    marginTop: "14px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "8px",
                    }}
                  >
                    Thêm món ăn vào thực đơn
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "130px 1fr auto",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <select
                      className="form-input"
                      style={{
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        height: "42px",
                      }}
                      value={selectedMealType}
                      onChange={(e) =>
                        setSelectedMealType(e.target.value as MealType)
                      }
                    >
                      <option value="breakfast">Bữa sáng</option>
                      <option value="lunch">Bữa trưa</option>
                      <option value="dinner">Bữa tối</option>
                      <option value="snack">Bữa phụ</option>
                    </select>

                    <select
                      className="form-input"
                      style={{
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        height: "42px",
                      }}
                      value={selectedRecipeId}
                      onChange={(e) => setSelectedRecipeId(e.target.value)}
                    >
                      {recipeOptions.length === 0 ? (
                        <option value="">Chưa có công thức món ăn nào</option>
                      ) : (
                        recipeOptions.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.title} ({r.calories_per_serving || 0} kcal)
                          </option>
                        ))
                      )}
                    </select>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ height: "42px", padding: "0 14px" }}
                      onClick={handleAddItemToTemplate}
                    >
                      + Thêm món
                    </button>
                  </div>

                  {/* List of chosen items */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      maxHeight: "180px",
                      overflowY: "auto",
                    }}
                  >
                    {templateFormData.items.length === 0 ? (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#94A3B8",
                          fontStyle: "italic",
                        }}
                      >
                        Chưa có món ăn nào được chọn. Hãy thêm món cho từng bữa
                        ăn!
                      </span>
                    ) : (
                      templateFormData.items.map((it, idx) => {
                        const styleInfo = MEAL_TYPE_LABELS[it.meal_type];
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  backgroundColor: styleInfo.bg,
                                  color: styleInfo.color,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {styleInfo.label}
                              </span>
                              <strong
                                style={{ fontSize: "13px", color: "#0F172A" }}
                              >
                                {getRecipeTitle(it.recipe_id)}
                              </strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromTemplate(idx)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#94A3B8",
                                cursor: "pointer",
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsTemplateFormOpen(false)}
                  disabled={isTemplateSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isTemplateSubmitting}
                >
                  {isTemplateSubmitting ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>
                      {templateFormMode === "create"
                        ? "Tạo Thực Đơn"
                        : "Lưu Thay Đổi"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Template Modal */}
      {templateToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setTemplateToDelete(null)}
        >
          <div
            className="modal-card modal-role-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ color: "#DC2626" }}>Xác nhận xóa thực đơn mẫu</h3>
              <button
                className="modal-close-btn"
                onClick={() => setTemplateToDelete(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {deleteTemplateError && (
                <div className="modal-error-banner">
                  <AlertCircle size={18} />
                  <span>{deleteTemplateError}</span>
                </div>
              )}
              <p style={{ fontSize: "14px", color: "#334155" }}>
                Bạn có chắc chắn muốn xóa thực đơn mẫu{" "}
                <strong>{templateToDelete.name}</strong> không?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setTemplateToDelete(null)}
                disabled={isDeletingTemplate}
              >
                Hủy bỏ
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  borderColor: "#DC2626",
                }}
                onClick={handleConfirmDeleteTemplate}
                disabled={isDeletingTemplate}
              >
                {isDeletingTemplate ? "Đang xóa..." : "Xóa Thực Đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS CHO CÔNG THỨC MÓN ĂN (RECIPES)
          ===================================================================== */}
      {/* 1. Recipe Detail Modal */}
      {isRecipeDetailOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsRecipeDetailOpen(false)}
        >
          <div
            className="modal-card modal-detail-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Chi tiết Công thức Món ăn</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsRecipeDetailOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {isRecipeDetailLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <Loader2 size={32} className="spinner" />
                  <p style={{ marginTop: "8px", color: "#64748B" }}>
                    Đang tải công thức...
                  </p>
                </div>
              ) : selectedRecipe ? (
                <div>
                  {/* Hero */}
                  <div
                    className="detail-profile-hero"
                    style={{ alignItems: "flex-start" }}
                  >
                    <div
                      className="detail-avatar"
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "16px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {selectedRecipe.image_url ? (
                        <img
                          src={selectedRecipe.image_url}
                          alt={selectedRecipe.title}
                        />
                      ) : (
                        <ChefHat size={36} color="#10B981" />
                      )}
                    </div>
                    <div className="detail-hero-text" style={{ flex: 1 }}>
                      <h4>{selectedRecipe.title}</h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          marginTop: "2px",
                        }}
                      >
                        {selectedRecipe.description ||
                          "Chưa có mô tả cho công thức này."}
                      </p>
                      <div
                        className="detail-tags-row"
                        style={{ marginTop: "8px" }}
                      >
                        <span className="id-badge">
                          ID: {selectedRecipe._id}
                        </span>
                        {selectedRecipe.source_type === "system" ? (
                          <span
                            className="role-pill role-pill-admin"
                            style={{ fontSize: "11px" }}
                          >
                            Hệ thống
                          </span>
                        ) : (
                          <span
                            className="role-pill role-pill-user"
                            style={{ fontSize: "11px" }}
                          >
                            Cộng đồng
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            backgroundColor: "#F1F5F9",
                            color: "#334155",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          Khẩu phần: {selectedRecipe.servings} người
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Grid */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      <Flame size={16} color="#F59E0B" />
                      <span>
                        Thành phần dinh dưỡng tóm tắt (trên 1 khẩu phần)
                      </span>
                    </div>
                    <div className="detail-grid-4">
                      <div className="detail-box">
                        <span className="box-label">Calo / Khẩu phần</span>
                        <span
                          className="box-value"
                          style={{ color: "#D97706" }}
                        >
                          {selectedRecipe.calories_per_serving ?? "--"}{" "}
                          <span style={{ fontSize: "11px" }}>kcal</span>
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Đạm (Protein)</span>
                        <span
                          className="box-value"
                          style={{ color: "#059669" }}
                        >
                          {selectedRecipe.protein_g ?? "--"} g
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Đường bột (Carb)</span>
                        <span
                          className="box-value"
                          style={{ color: "#2563EB" }}
                        >
                          {selectedRecipe.carb_g ?? "--"} g
                        </span>
                      </div>
                      <div className="detail-box">
                        <span className="box-label">Chất béo (Fat)</span>
                        <span
                          className="box-value"
                          style={{ color: "#7C3AED" }}
                        >
                          {selectedRecipe.fat_g ?? "--"} g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      <Utensils size={16} color="#059669" />
                      <span>
                        Nguyên liệu chuẩn bị (
                        {selectedRecipe.ingredients?.length || 0})
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "8px",
                      }}
                    >
                      {selectedRecipe.ingredients &&
                      selectedRecipe.ingredients.length > 0 ? (
                        selectedRecipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                              fontSize: "13px",
                            }}
                          >
                            <strong>{ing.ingredient_name}</strong>
                            <span style={{ color: "#64748B" }}>
                              {ing.quantity ?? ""} {ing.unit || ""}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span
                          style={{
                            fontSize: "12.5px",
                            color: "#94A3B8",
                            fontStyle: "italic",
                          }}
                        >
                          Chưa có danh sách nguyên liệu.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      <ChefHat size={16} color="#2563EB" />
                      <span>
                        Các bước thực hiện ({selectedRecipe.steps?.length || 0})
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {selectedRecipe.steps &&
                      selectedRecipe.steps.length > 0 ? (
                        selectedRecipe.steps.map((st) => (
                          <div
                            key={st.step_number}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              padding: "8px 12px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "11px",
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                                fontSize: "11px",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {st.step_number}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#334155",
                                lineHeight: "1.4",
                              }}
                            >
                              {st.instruction}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span
                          style={{
                            fontSize: "12.5px",
                            color: "#94A3B8",
                            fontStyle: "italic",
                          }}
                        >
                          Chưa có hướng dẫn các bước nấu.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="detail-timestamps">
                    <Calendar size={14} />
                    <span>
                      Ngày tạo: {formatDate(selectedRecipe.created_at)}
                    </span>
                    <span style={{ marginLeft: "12px" }}>
                      • Đánh giá:{" "}
                      <strong>{selectedRecipe.avg_rating || 5.0}★</strong> (
                      {selectedRecipe.comment_count || 0} bình luận)
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsRecipeDetailOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Create / Edit Recipe Modal */}
      {isRecipeFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsRecipeFormOpen(false)}
        >
          <div
            className="modal-card modal-detail-card"
            style={{ maxWidth: "650px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {recipeFormMode === "create"
                  ? "Tạo Công Thức Món Ăn Mới"
                  : "Chỉnh Sửa Công Thức"}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsRecipeFormOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecipeFormSubmit}>
              <div className="modal-body" style={{ maxHeight: "75vh" }}>
                {recipeFormError && (
                  <div className="modal-error-banner">
                    <AlertCircle size={18} />
                    <span>{recipeFormError}</span>
                  </div>
                )}

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "4px",
                    }}
                  >
                    Tên công thức món ăn{" "}
                    <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "14px", height: "42px" }}
                    placeholder="VD: Ức gà áp chảo sốt chanh leo"
                    value={recipeFormData.title}
                    onChange={(e) =>
                      setRecipeFormData({
                        ...recipeFormData,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "4px",
                    }}
                  >
                    Mô tả công thức
                  </label>
                  <textarea
                    className="form-input"
                    style={{
                      padding: "8px 12px",
                      height: "60px",
                      resize: "none",
                    }}
                    placeholder="Hương vị, đặc điểm nổi bật của món..."
                    value={recipeFormData.description}
                    onChange={(e) =>
                      setRecipeFormData({
                        ...recipeFormData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Image URL & Servings */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0F172A",
                        marginBottom: "4px",
                      }}
                    >
                      URL Ảnh minh họa
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      style={{ paddingLeft: "12px", height: "42px" }}
                      placeholder="https://images.unsplash.com/..."
                      value={recipeFormData.image_url}
                      onChange={(e) =>
                        setRecipeFormData({
                          ...recipeFormData,
                          image_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0F172A",
                        marginBottom: "4px",
                      }}
                    >
                      Khẩu phần *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ paddingLeft: "12px", height: "42px" }}
                      placeholder="1"
                      value={recipeFormData.servings}
                      onChange={(e) =>
                        setRecipeFormData({
                          ...recipeFormData,
                          servings: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Prep & Cook Time */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Thời gian chuẩn bị (phút)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: "12px", height: "40px" }}
                      placeholder="15"
                      value={recipeFormData.prep_time_minutes}
                      onChange={(e) =>
                        setRecipeFormData({
                          ...recipeFormData,
                          prep_time_minutes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Thời gian nấu (phút)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: "12px", height: "40px" }}
                      placeholder="20"
                      value={recipeFormData.cook_time_minutes}
                      onChange={(e) =>
                        setRecipeFormData({
                          ...recipeFormData,
                          cook_time_minutes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Macro summary */}
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "4px",
                    }}
                  >
                    Dinh dưỡng tóm tắt trên 1 khẩu phần
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#D97706",
                        }}
                      >
                        Calo (kcal)
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{
                          paddingLeft: "10px",
                          height: "38px",
                          marginTop: "2px",
                        }}
                        placeholder="350"
                        value={recipeFormData.calories_per_serving}
                        onChange={(e) =>
                          setRecipeFormData({
                            ...recipeFormData,
                            calories_per_serving: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#059669",
                        }}
                      >
                        Đạm (g)
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{
                          paddingLeft: "10px",
                          height: "38px",
                          marginTop: "2px",
                        }}
                        placeholder="35"
                        value={recipeFormData.protein_g}
                        onChange={(e) =>
                          setRecipeFormData({
                            ...recipeFormData,
                            protein_g: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#2563EB",
                        }}
                      >
                        Carb (g)
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{
                          paddingLeft: "10px",
                          height: "38px",
                          marginTop: "2px",
                        }}
                        placeholder="10"
                        value={recipeFormData.carb_g}
                        onChange={(e) =>
                          setRecipeFormData({
                            ...recipeFormData,
                            carb_g: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#7C3AED",
                        }}
                      >
                        Fat (g)
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{
                          paddingLeft: "10px",
                          height: "38px",
                          marginTop: "2px",
                        }}
                        placeholder="8"
                        value={recipeFormData.fat_g}
                        onChange={(e) =>
                          setRecipeFormData({
                            ...recipeFormData,
                            fat_g: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Ingredients Editor */}
                <div
                  style={{
                    borderTop: "1px dashed #CBD5E1",
                    paddingTop: "12px",
                    marginTop: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "6px",
                    }}
                  >
                    Nguyên liệu ({recipeFormData.ingredients.length})
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px auto",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "10px", height: "38px" }}
                      placeholder="Tên nguyên liệu *"
                      value={newIngredient.ingredient_name}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          ingredient_name: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ paddingLeft: "10px", height: "38px" }}
                      placeholder="Số lượng"
                      value={
                        newIngredient.quantity !== null &&
                        newIngredient.quantity !== undefined
                          ? newIngredient.quantity
                          : ""
                      }
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          quantity:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "10px", height: "38px" }}
                      placeholder="Đơn vị (g, ml)"
                      value={newIngredient.unit || ""}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          unit: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: "38px", padding: "0 12px" }}
                      onClick={handleAddIngredient}
                    >
                      + Thêm
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      maxHeight: "120px",
                      overflowY: "auto",
                    }}
                  >
                    {recipeFormData.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#F1F5F9",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <strong>{ing.ingredient_name}</strong>
                        {ing.quantity && (
                          <span>
                            ({ing.quantity} {ing.unit || ""})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Steps Editor */}
                <div
                  style={{
                    borderTop: "1px dashed #CBD5E1",
                    paddingTop: "12px",
                    marginTop: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "6px",
                    }}
                  >
                    Các bước thực hiện ({recipeFormData.steps.length})
                  </label>
                  <div
                    style={{ display: "flex", gap: "6px", marginBottom: "8px" }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "10px", height: "38px", flex: 1 }}
                      placeholder={`Bước ${recipeFormData.steps.length + 1}: Hướng dẫn thực hiện...`}
                      value={newStepInstruction}
                      onChange={(e) => setNewStepInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: "38px", padding: "0 12px" }}
                      onClick={handleAddStep}
                    >
                      + Thêm bước
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      maxHeight: "120px",
                      overflowY: "auto",
                    }}
                  >
                    {recipeFormData.steps.map((st, idx) => (
                      <div
                        key={st.step_number}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "4px 8px",
                          backgroundColor: "#F8FAFC",
                          borderRadius: "4px",
                          border: "1px solid #E2E8F0",
                          fontSize: "12px",
                        }}
                      >
                        <span>
                          <strong>B{st.step_number}:</strong> {st.instruction}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsRecipeFormOpen(false)}
                  disabled={isRecipeSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isRecipeSubmitting}
                >
                  {isRecipeSubmitting ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>
                      {recipeFormMode === "create"
                        ? "Tạo Công Thức"
                        : "Lưu Thay Đổi"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Recipe Modal */}
      {recipeToDelete && (
        <div className="modal-backdrop" onClick={() => setRecipeToDelete(null)}>
          <div
            className="modal-card modal-role-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ color: "#DC2626" }}>Xác nhận xóa công thức</h3>
              <button
                className="modal-close-btn"
                onClick={() => setRecipeToDelete(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {deleteRecipeError && (
                <div className="modal-error-banner">
                  <AlertCircle size={18} />
                  <span>{deleteRecipeError}</span>
                </div>
              )}
              <p style={{ fontSize: "14px", color: "#334155" }}>
                Bạn có chắc chắn muốn xóa công thức{" "}
                <strong>{recipeToDelete.title}</strong> không?
              </p>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#64748B",
                  backgroundColor: "#F8FAFC",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                }}
              >
                🛡️ <strong>Bảo vệ tham chiếu:</strong> Hệ thống sẽ tự động kiểm
                tra xem công thức có đang nằm trong thực đơn mẫu hoặc kế hoạch
                bữa ăn của người dùng không trước khi cho phép xóa.
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setRecipeToDelete(null)}
                disabled={isDeletingRecipe}
              >
                Hủy bỏ
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  borderColor: "#DC2626",
                }}
                onClick={handleConfirmDeleteRecipe}
                disabled={isDeletingRecipe}
              >
                {isDeletingRecipe ? "Đang xóa..." : "Xóa Công Thức"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
