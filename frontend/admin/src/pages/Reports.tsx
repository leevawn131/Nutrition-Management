import React, { useState, useEffect, useCallback } from "react";
import { adminReportService } from "../services/report.service";
import {
  Timeframe,
  OverviewKPIs,
  UserReportsData,
  FoodReportsData,
  RecipeReportsData,
} from "../types/report.types";
import {
  BarChart3,
  Users,
  UtensilsCrossed,
  BookOpen,
  Layers,
  Flame,
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Activity,
  ShieldCheck,
  Star,
  Sparkles,
  Award,
  HelpCircle,
} from "lucide-react";

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "90 ngày qua" },
  { value: "all", label: "Tất cả" },
];

const GOAL_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  lose: { label: "Giảm mỡ / Giảm cân", color: "#DC2626", bg: "#FEF2F2" },
  maintain: { label: "Duy trì vóc dáng", color: "#2563EB", bg: "#EFF6FF" },
  gain: { label: "Tăng cơ / Tăng cân", color: "#059669", bg: "#ECFDF5" },
  unspecified: { label: "Chưa thiết lập", color: "#64748B", bg: "#F8FAFC" },
};

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  sedentary: { label: "Ít vận động (Ngồi nhiều)", color: "#94A3B8" },
  light: { label: "Vận động nhẹ (1-3 ngày/tuần)", color: "#3B82F6" },
  moderate: { label: "Vận động vừa (3-5 ngày/tuần)", color: "#10B981" },
  active: { label: "Vận động nhiều (6-7 ngày/tuần)", color: "#F59E0B" },
  very_active: { label: "Cường độ cao / Vận động viên", color: "#8B5CF6" },
  unspecified: { label: "Chưa cập nhật", color: "#CBD5E1" },
};

export const Reports: React.FC = () => {
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "foods" | "recipes"
  >("overview");
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  // Data States
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [userData, setUserData] = useState<UserReportsData | null>(null);
  const [foodData, setFoodData] = useState<FoodReportsData | null>(null);
  const [recipeData, setRecipeData] = useState<RecipeReportsData | null>(null);

  // Status States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all report data
  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, usersRes, foodsRes, recipesRes] = await Promise.all([
        adminReportService.getOverview(),
        adminReportService.getUserReports(timeframe),
        adminReportService.getFoodReports(),
        adminReportService.getRecipeReports(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setKpis(overviewRes.data.kpis);
      }
      if (usersRes.success && usersRes.data) {
        setUserData(usersRes.data);
      }
      if (foodsRes.success && foodsRes.data) {
        setFoodData(foodsRes.data);
      }
      if (recipesRes.success && recipesRes.data) {
        setRecipeData(recipesRes.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải báo cáo & thống kê:", err);
      setError(
        err.response?.data?.message ||
          "Không thể tải dữ liệu báo cáo thống kê. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  // Helper calculating max value for trend chart scaling
  const maxTrendCount = userData?.registration_trend?.length
    ? Math.max(...userData.registration_trend.map((t) => t.count), 1)
    : 1;

  // Helper calculating total for percentage calculations
  const totalGoalUsers = userData
    ? Object.values(userData.goals_distribution).reduce((acc, c) => acc + c, 0)
    : 0;

  const totalActivityUsers = userData
    ? Object.values(userData.activity_level_distribution).reduce(
        (acc, c) => acc + c,
        0,
      )
    : 0;

  const totalFoodItems = foodData
    ? foodData.verification_stats.verified +
      foodData.verification_stats.unverified
    : 0;

  const totalRecipes = recipeData
    ? recipeData.source_distribution.system +
      recipeData.source_distribution.community
    : 0;

  return (
    <div className="users-page">
      {/* 1. Header & Controls */}
      <div className="page-header-row" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-heading">Báo cáo & Thống kê Hệ thống</h1>
          <p className="page-subheading">
            Theo dõi toàn diện các chỉ số tăng trưởng người dùng, dữ liệu dinh
            dưỡng, công thức và kiểm duyệt.
          </p>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveTab("overview")}
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
                  activeTab === "overview" ? "#10B981" : "#FFFFFF",
                color: activeTab === "overview" ? "#FFFFFF" : "#475569",
                borderColor: activeTab === "overview" ? "#10B981" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              <BarChart3 size={16} />
              <span>Tổng quan (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
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
                backgroundColor: activeTab === "users" ? "#10B981" : "#FFFFFF",
                color: activeTab === "users" ? "#FFFFFF" : "#475569",
                borderColor: activeTab === "users" ? "#10B981" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              <Users size={16} />
              <span>Người dùng (Users)</span>
            </button>

            <button
              onClick={() => setActiveTab("foods")}
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
                backgroundColor: activeTab === "foods" ? "#10B981" : "#FFFFFF",
                color: activeTab === "foods" ? "#FFFFFF" : "#475569",
                borderColor: activeTab === "foods" ? "#10B981" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              <UtensilsCrossed size={16} />
              <span>Thực phẩm & Dinh dưỡng</span>
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
              <span>Công thức & Thực đơn</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Timeframe */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Timeframe Selector (Shown for Users Tab & Overview) */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#F1F5F9",
              padding: "3px",
              borderRadius: "8px",
            }}
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeframe(opt.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: timeframe === opt.value ? 700 : 500,
                  backgroundColor:
                    timeframe === opt.value ? "#FFFFFF" : "transparent",
                  color: timeframe === opt.value ? "#0F172A" : "#64748B",
                  boxShadow:
                    timeframe === opt.value
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            className="btn-secondary"
            onClick={fetchAllReports}
            disabled={isLoading}
            title="Làm mới báo cáo"
          >
            <RefreshCw size={16} className={isLoading ? "spinner" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Global Error Banner */}
      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={fetchAllReports}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#DC2626",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Loading Skeleton */}
      {isLoading ? (
        <div
          className="table-card"
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <Loader2
            size={36}
            className="spinner"
            style={{ margin: "0 auto", color: "#10B981" }}
          />
          <h3 style={{ marginTop: "16px", fontSize: "16px", color: "#1E293B" }}>
            Đang phân tích dữ liệu hệ thống...
          </h3>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
            Tổng hợp dữ liệu từ cơ sở dữ liệu MongoDB an toàn không để lộ thông
            tin cá nhân.
          </p>
        </div>
      ) : (
        <>
          {/* =================================================================
              TAB 1: TỔNG QUAN (OVERVIEW)
              ================================================================= */}
          {activeTab === "overview" && kpis && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Alert for Pending Moderation Items */}
              {(kpis.pending_recipes > 0 ||
                kpis.pending_unidentified_foods > 0) && (
                <div
                  style={{
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <AlertTriangle size={22} color="#D97706" />
                    <div>
                      <strong style={{ color: "#92400E", fontSize: "14px" }}>
                        Cần xử lý kiểm duyệt:
                      </strong>
                      <span
                        style={{
                          color: "#B45309",
                          fontSize: "13px",
                          marginLeft: "6px",
                        }}
                      >
                        Có <strong>{kpis.pending_recipes}</strong> công thức
                        cộng đồng và{" "}
                        <strong>{kpis.pending_unidentified_foods}</strong> món
                        ăn chưa xác định đang chờ duyệt.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6 Top KPI Cards */}
              <div
                className="stats-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                }}
              >
                {/* 1. Users */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
                    >
                      <Users size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}
                    >
                      Tài khoản
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">{kpis.total_users}</h3>
                    <p className="stat-title">Tổng người dùng</p>
                    <span className="stat-subtitle">
                      Thành viên trong hệ thống
                    </span>
                  </div>
                </div>

                {/* 2. Food Items */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
                    >
                      <UtensilsCrossed size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#ECFDF5", color: "#047857" }}
                    >
                      Từ điển món
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">{kpis.total_foods}</h3>
                    <p className="stat-title">Tổng món ăn</p>
                    <span className="stat-subtitle">Thực phẩm dinh dưỡng</span>
                  </div>
                </div>

                {/* 3. Recipes */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6" }}
                    >
                      <BookOpen size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#F5F3FF", color: "#6D28D9" }}
                    >
                      Công thức
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">{kpis.total_recipes}</h3>
                    <p className="stat-title">Công thức món ăn</p>
                    <span className="stat-subtitle">Hệ thống & Cộng đồng</span>
                  </div>
                </div>

                {/* 4. Meal Plan Templates */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#EEF2FF", color: "#6366F1" }}
                    >
                      <Layers size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}
                    >
                      Thực đơn mẫu
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">
                      {kpis.total_meal_plan_templates}
                    </h3>
                    <p className="stat-title">Gói thực đơn chuẩn</p>
                    <span className="stat-subtitle">
                      Dinh dưỡng theo mục tiêu
                    </span>
                  </div>
                </div>

                {/* 5. Total Meal Logs */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#FFF7ED", color: "#EA580C" }}
                    >
                      <Flame size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}
                    >
                      Nhật ký ăn
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">{kpis.total_meal_logs}</h3>
                    <p className="stat-title">Lượt ghi nhận bữa ăn</p>
                    <span className="stat-subtitle">Toàn hệ thống</span>
                  </div>
                </div>

                {/* 6. Pending Moderation */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon-wrapper"
                      style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
                    >
                      <AlertTriangle size={22} />
                    </div>
                    <span
                      className="stat-badge"
                      style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}
                    >
                      Kiểm duyệt
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value" style={{ color: "#D97706" }}>
                      {kpis.pending_recipes + kpis.pending_unidentified_foods}
                    </h3>
                    <p className="stat-title">Mục chờ phê duyệt</p>
                    <span className="stat-subtitle">Công thức & Món lạ</span>
                  </div>
                </div>
              </div>

              {/* System Distribution Summary Grids */}
              <div className="dashboard-grid-2">
                {/* Food Verification Health */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <ShieldCheck size={20} color="#10B981" />
                      <h3>Tỷ lệ Chuẩn hóa Cơ sở Dữ liệu Món ăn</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    {foodData && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "28px",
                              fontWeight: 800,
                              color: "#10B981",
                            }}
                          >
                            {foodData.verification_stats.verified_rate}%
                          </span>
                          <span style={{ fontSize: "13px", color: "#64748B" }}>
                            <strong>
                              {foodData.verification_stats.verified}
                            </strong>{" "}
                            / {totalFoodItems} món đã xác thực
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: "100%",
                            height: "10px",
                            backgroundColor: "#E2E8F0",
                            borderRadius: "5px",
                            overflow: "hidden",
                            marginTop: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: `${foodData.verification_stats.verified_rate}%`,
                              height: "100%",
                              backgroundColor: "#10B981",
                              borderRadius: "5px",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginTop: "20px",
                          }}
                        >
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "8px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748B",
                                display: "block",
                              }}
                            >
                              Món đã xác thực (Verified)
                            </span>
                            <strong
                              style={{ fontSize: "18px", color: "#059669" }}
                            >
                              {foodData.verification_stats.verified}
                            </strong>
                          </div>
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "8px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748B",
                                display: "block",
                              }}
                            >
                              Món chưa duyệt / Đóng góp
                            </span>
                            <strong
                              style={{ fontSize: "18px", color: "#D97706" }}
                            >
                              {foodData.verification_stats.unverified}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recipe Breakdown by Source & Moderation */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <BookOpen size={20} color="#3B82F6" />
                      <h3>Cơ cấu Nguồn & Trạng thái Công thức</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    {recipeData && (
                      <div>
                        {/* Source Distribution */}
                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "13px",
                              marginBottom: "6px",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#334155" }}>
                              Nguồn công thức:
                            </span>
                            <span style={{ color: "#64748B" }}>
                              Hệ thống:{" "}
                              <strong>
                                {recipeData.source_distribution.system}
                              </strong>{" "}
                              • Cộng đồng:{" "}
                              <strong>
                                {recipeData.source_distribution.community}
                              </strong>
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              backgroundColor: "#E2E8F0",
                              borderRadius: "4px",
                              display: "flex",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  totalRecipes > 0
                                    ? `${(recipeData.source_distribution.system / totalRecipes) * 100}%`
                                    : "0%",
                                backgroundColor: "#10B981",
                              }}
                              title="Hệ thống"
                            />
                            <div
                              style={{
                                width:
                                  totalRecipes > 0
                                    ? `${(recipeData.source_distribution.community / totalRecipes) * 100}%`
                                    : "0%",
                                backgroundColor: "#3B82F6",
                              }}
                              title="Cộng đồng"
                            />
                          </div>
                        </div>

                        {/* Status Badges Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "10px",
                            marginTop: "16px",
                          }}
                        >
                          <div
                            style={{
                              textAlign: "center",
                              padding: "10px",
                              backgroundColor: "#ECFDF5",
                              borderRadius: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#059669",
                                display: "block",
                              }}
                            >
                              Đã phê duyệt
                            </span>
                            <strong
                              style={{ fontSize: "18px", color: "#059669" }}
                            >
                              {recipeData.status_distribution.approved}
                            </strong>
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              padding: "10px",
                              backgroundColor: "#FEF3C7",
                              borderRadius: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#D97706",
                                display: "block",
                              }}
                            >
                              Chờ kiểm duyệt
                            </span>
                            <strong
                              style={{ fontSize: "18px", color: "#D97706" }}
                            >
                              {recipeData.status_distribution.pending}
                            </strong>
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              padding: "10px",
                              backgroundColor: "#FEF2F2",
                              borderRadius: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#DC2626",
                                display: "block",
                              }}
                            >
                              Bị từ chối
                            </span>
                            <strong
                              style={{ fontSize: "18px", color: "#DC2626" }}
                            >
                              {recipeData.status_distribution.rejected}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: NGƯỜI DÙNG (USERS)
              ================================================================= */}
          {activeTab === "users" && userData && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* 1. Registration Trend Chart (SVG/CSS Bars) */}
              <div className="content-card">
                <div className="card-header">
                  <div className="card-header-title">
                    <TrendingUp size={20} color="#10B981" />
                    <h3>
                      Xu hướng Đăng ký Tài khoản (
                      {
                        TIMEFRAME_OPTIONS.find((t) => t.value === timeframe)
                          ?.label
                      }
                      )
                    </h3>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Tổng lượt đăng ký:{" "}
                    <strong>
                      {userData.registration_trend.reduce(
                        (a, b) => a + b.count,
                        0,
                      )}
                    </strong>
                  </span>
                </div>
                <div className="card-body">
                  {userData.registration_trend.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#94A3B8",
                      }}
                    >
                      <Users
                        size={36}
                        color="#CBD5E1"
                        style={{ margin: "0 auto 8px" }}
                      />
                      <p>
                        Không có dữ liệu đăng ký mới trong khung thời gian đã
                        chọn.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Bar Chart Container */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "6px",
                          height: "200px",
                          paddingTop: "20px",
                          borderBottom: "1px solid #CBD5E1",
                          overflowX: "auto",
                        }}
                      >
                        {userData.registration_trend.map((t, idx) => {
                          const barHeight = Math.max(
                            (t.count / maxTrendCount) * 160,
                            6,
                          );
                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flex: 1,
                                minWidth: "24px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  color: "#10B981",
                                  marginBottom: "4px",
                                }}
                              >
                                {t.count > 0 ? t.count : ""}
                              </span>
                              <div
                                style={{
                                  width: "100%",
                                  height: `${barHeight}px`,
                                  backgroundColor: "#10B981",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s ease",
                                }}
                                title={`${t.date}: ${t.count} người đăng ký`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Date Axis Labels */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          fontSize: "11px",
                          color: "#64748B",
                        }}
                      >
                        <span>{userData.registration_trend[0]?.date}</span>
                        <span>
                          {
                            userData.registration_trend[
                              userData.registration_trend.length - 1
                            ]?.date
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Goals & Activity Distribution */}
              <div className="dashboard-grid-2">
                {/* Goal Distribution */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <Target size={20} color="#3B82F6" />
                      <h3>Phân bố Mục tiêu Sức khỏe</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {Object.entries(userData.goals_distribution).map(
                        ([goalKey, count]) => {
                          const styleInfo =
                            GOAL_LABELS[goalKey] || GOAL_LABELS.unspecified;
                          const pct =
                            totalGoalUsers > 0
                              ? ((count / totalGoalUsers) * 100).toFixed(1)
                              : "0";

                          return (
                            <div key={goalKey}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{ fontWeight: 600, color: "#1E293B" }}
                                >
                                  {styleInfo.label}
                                </span>
                                <span style={{ color: "#64748B" }}>
                                  <strong>{count}</strong> ({pct}%)
                                </span>
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: "8px",
                                  backgroundColor: "#F1F5F9",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    backgroundColor: styleInfo.color,
                                    borderRadius: "4px",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Level Distribution */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <Activity size={20} color="#F59E0B" />
                      <h3>Mức độ Vận động Người dùng</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {Object.entries(userData.activity_level_distribution).map(
                        ([actKey, count]) => {
                          const styleInfo =
                            ACTIVITY_LABELS[actKey] ||
                            ACTIVITY_LABELS.unspecified;
                          const pct =
                            totalActivityUsers > 0
                              ? ((count / totalActivityUsers) * 100).toFixed(1)
                              : "0";

                          return (
                            <div key={actKey}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{ fontWeight: 600, color: "#1E293B" }}
                                >
                                  {styleInfo.label}
                                </span>
                                <span style={{ color: "#64748B" }}>
                                  <strong>{count}</strong> ({pct}%)
                                </span>
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: "8px",
                                  backgroundColor: "#F1F5F9",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    backgroundColor: styleInfo.color,
                                    borderRadius: "4px",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: THỰC PHẨM & DINH DƯỠNG (FOODS)
              ================================================================= */}
          {activeTab === "foods" && foodData && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div className="dashboard-grid-2">
                {/* 1. Category Distribution List */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <UtensilsCrossed size={20} color="#10B981" />
                      <h3>
                        Phân bố Danh mục Món ăn (
                        {foodData.categories_distribution.length} nhóm)
                      </h3>
                    </div>
                  </div>
                  <div className="card-body">
                    {foodData.categories_distribution.length === 0 ? (
                      <p style={{ color: "#94A3B8", fontStyle: "italic" }}>
                        Chưa có dữ liệu danh mục món ăn.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {foodData.categories_distribution.map((cat, idx) => {
                          const pct =
                            totalFoodItems > 0
                              ? ((cat.count / totalFoodItems) * 100).toFixed(1)
                              : "0";
                          return (
                            <div key={idx}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                }}
                              >
                                <strong style={{ color: "#0F172A" }}>
                                  {cat.category || "Khác"}
                                </strong>
                                <span style={{ color: "#64748B" }}>
                                  {cat.count} món ({pct}%)
                                </span>
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: "8px",
                                  backgroundColor: "#F1F5F9",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    backgroundColor: "#10B981",
                                    borderRadius: "4px",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Unidentified Foods Resolution Rate */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <HelpCircle size={20} color="#F59E0B" />
                      <h3>Món ăn Chưa Xác định (AI / User Reports)</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          backgroundColor: "#F8FAFC",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#64748B",
                              display: "block",
                            }}
                          >
                            Tổng số món báo cáo
                          </span>
                          <strong
                            style={{ fontSize: "24px", color: "#0F172A" }}
                          >
                            {foodData.unidentified_foods_stats.total}
                          </strong>
                        </div>
                        <Sparkles size={32} color="#CBD5E1" />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            padding: "14px",
                            backgroundColor: "#FEF3C7",
                            borderRadius: "8px",
                            border: "1px solid #FDE68A",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12.5px",
                              color: "#92400E",
                              display: "block",
                              fontWeight: 600,
                            }}
                          >
                            Chờ Admin xử lý
                          </span>
                          <strong
                            style={{ fontSize: "20px", color: "#D97706" }}
                          >
                            {foodData.unidentified_foods_stats.pending}
                          </strong>
                        </div>
                        <div
                          style={{
                            padding: "14px",
                            backgroundColor: "#ECFDF5",
                            borderRadius: "8px",
                            border: "1px solid #A7F3D0",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12.5px",
                              color: "#065F46",
                              display: "block",
                              fontWeight: 600,
                            }}
                          >
                            Đã chuẩn hóa xong
                          </span>
                          <strong
                            style={{ fontSize: "20px", color: "#059669" }}
                          >
                            {foodData.unidentified_foods_stats.resolved}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: CÔNG THỨC & THỰC ĐƠN (RECIPES)
              ================================================================= */}
          {activeTab === "recipes" && recipeData && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div className="dashboard-grid-2">
                {/* 1. Top Rated Recipes Leaderboard */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <Award size={20} color="#F59E0B" />
                      <h3>Top Công thức được Đánh giá Cao nhất</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    {recipeData.top_rated_recipes.length === 0 ? (
                      <p style={{ color: "#94A3B8", fontStyle: "italic" }}>
                        Chưa có công thức nào có đánh giá.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {recipeData.top_rated_recipes.map((rec, idx) => (
                          <div
                            key={rec._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "8px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <span
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "12px",
                                  backgroundColor:
                                    idx === 0
                                      ? "#FEF3C7"
                                      : idx === 1
                                        ? "#E2E8F0"
                                        : "#F1F5F9",
                                  color: idx === 0 ? "#B45309" : "#475569",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                #{idx + 1}
                              </span>
                              <strong
                                style={{ fontSize: "13.5px", color: "#0F172A" }}
                              >
                                {rec.title}
                              </strong>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Star size={15} fill="#F59E0B" color="#F59E0B" />
                              <strong
                                style={{ fontSize: "13px", color: "#D97706" }}
                              >
                                {rec.avg_rating
                                  ? rec.avg_rating.toFixed(1)
                                  : "5.0"}
                              </strong>
                              <span
                                style={{ fontSize: "11.5px", color: "#94A3B8" }}
                              >
                                ({rec.comment_count} bình luận)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Meal Plan Templates Summary */}
                <div className="content-card">
                  <div className="card-header">
                    <div className="card-header-title">
                      <Layers size={20} color="#6366F1" />
                      <h3>Khai thác Thực đơn Dinh dưỡng mẫu</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#EEF2FF",
                          borderRadius: "8px",
                          border: "1px solid #C7D2FE",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#3730A3",
                            display: "block",
                            fontWeight: 600,
                          }}
                        >
                          Tổng số gói thực đơn mẫu
                        </span>
                        <strong style={{ fontSize: "28px", color: "#4338CA" }}>
                          {
                            recipeData.meal_plan_templates_summary
                              .total_templates
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#F8FAFC",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#64748B",
                            display: "block",
                          }}
                        >
                          Số lượng món ăn trung bình / Thực đơn
                        </span>
                        <strong style={{ fontSize: "22px", color: "#0F172A" }}>
                          {
                            recipeData.meal_plan_templates_summary
                              .avg_items_per_template
                          }{" "}
                          <span style={{ fontSize: "14px", fontWeight: 500 }}>
                            món/thực đơn
                          </span>
                        </strong>
                      </div>

                      <div
                        className="dashboard-tip-box"
                        style={{ marginTop: "0" }}
                      >
                        <p style={{ fontSize: "12px" }}>
                          💡 <strong>Khuyến nghị:</strong> Mỗi thực đơn mẫu
                          chuẩn nên có từ 3 đến 5 món trải đều các bữa sáng,
                          trưa, tối và bữa phụ để người dùng dễ dàng áp dụng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
