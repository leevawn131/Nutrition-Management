const mongoose = require("mongoose");
const User = require("../models/user.model");
const FoodItem = require("../models/food_item.model");
const Recipe = require("../models/recipe.model");
const MealPlanTemplate = require("../models/meal_plan_template.model");

class AdminReportService {
  /**
   * 1. GET OVERVIEW KPIs
   * Trả về các chỉ số KPI tổng quan trên toàn bộ hệ thống
   */
  async getOverview() {
    const [
      totalUsers,
      totalFoods,
      totalRecipes,
      totalTemplates,
      totalMealLogs,
      pendingRecipes,
      pendingUnidentifiedFoods,
    ] = await Promise.all([
      User.countDocuments(),
      FoodItem.countDocuments(),
      Recipe.countDocuments(),
      MealPlanTemplate.countDocuments(),
      mongoose.connection.collection("meal_logs").countDocuments(),
      Recipe.countDocuments({ status: "pending" }),
      mongoose.connection
        .collection("unidentified_foods")
        .countDocuments({ status: "pending" }),
    ]);

    return {
      kpis: {
        total_users: totalUsers,
        total_foods: totalFoods,
        total_recipes: totalRecipes,
        total_meal_plan_templates: totalTemplates,
        total_meal_logs: totalMealLogs,
        pending_recipes: pendingRecipes,
        pending_unidentified_foods: pendingUnidentifiedFoods,
      },
    };
  }

  /**
   * 2. GET USER REPORTS
   * Phân tích tăng trưởng và cơ cấu người dùng
   * Tham số: timeframe ('7d' | '30d' | '90d' | '1y' | 'all')
   */
  async getUserReports(timeframe = "30d") {
    const validTimeframes = ["7d", "30d", "90d", "1y", "all"];
    if (!validTimeframes.includes(timeframe)) {
      const error = new Error(
        "Tham số timeframe không hợp lệ. Chỉ chấp nhận: 7d, 30d, 90d, 1y hoặc all.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Xác định mốc thời gian lọc đăng ký
    let startDate = null;
    const now = new Date();

    if (timeframe === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "1y") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const trendMatch = startDate ? { created_at: { $gte: startDate } } : {};

    // Thực thi các Aggregation Pipeline bảo vệ dữ liệu cá nhân
    const [trendResult, goalsResult, activityResult, rolesResult] =
      await Promise.all([
        // Xu hướng đăng ký theo ngày
        User.aggregate([
          { $match: trendMatch },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Phân bố mục tiêu sức khỏe
        User.aggregate([
          {
            $group: {
              _id: { $ifNull: ["$goal", "unspecified"] },
              count: { $sum: 1 },
            },
          },
        ]),

        // Phân bố mức độ vận động
        User.aggregate([
          {
            $group: {
              _id: { $ifNull: ["$activity_level", "unspecified"] },
              count: { $sum: 1 },
            },
          },
        ]),

        // Phân bố vai trò
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    // Định dạng chuỗi kết quả xu hướng đăng ký
    const registrationTrend = trendResult.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    // Định dạng goals_distribution
    const goalsDistribution = {
      lose: 0,
      maintain: 0,
      gain: 0,
      unspecified: 0,
    };
    goalsResult.forEach((item) => {
      if (goalsDistribution[item._id] !== undefined) {
        goalsDistribution[item._id] = item.count;
      } else {
        goalsDistribution.unspecified += item.count;
      }
    });

    // Định dạng activity_level_distribution
    const activityLevelDistribution = {
      sedentary: 0,
      light: 0,
      moderate: 0,
      active: 0,
      very_active: 0,
      unspecified: 0,
    };
    activityResult.forEach((item) => {
      if (activityLevelDistribution[item._id] !== undefined) {
        activityLevelDistribution[item._id] = item.count;
      } else {
        activityLevelDistribution.unspecified += item.count;
      }
    });

    // Định dạng roles_distribution
    const rolesDistribution = {
      user: 0,
      admin: 0,
    };
    rolesResult.forEach((item) => {
      if (rolesDistribution[item._id] !== undefined) {
        rolesDistribution[item._id] = item.count;
      }
    });

    return {
      registration_trend: registrationTrend,
      goals_distribution: goalsDistribution,
      activity_level_distribution: activityLevelDistribution,
      roles_distribution: rolesDistribution,
    };
  }

  /**
   * 3. GET FOOD REPORTS
   * Phân tích cơ sở dữ liệu thực phẩm & tình trạng xác thực
   */
  async getFoodReports() {
    const [verificationResult, categoriesResult, unidentifiedStatsResult] =
      await Promise.all([
        // Thống kê xác thực
        FoodItem.aggregate([
          {
            $group: {
              _id: "$is_verified",
              count: { $sum: 1 },
            },
          },
        ]),

        // Phân bố theo danh mục
        FoodItem.aggregate([
          {
            $group: {
              _id: { $ifNull: ["$category", "Khác"] },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Thống kê món ăn chưa nhận diện
        mongoose.connection
          .collection("unidentified_foods")
          .aggregate([
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
      ]);

    let verified = 0;
    let unverified = 0;

    verificationResult.forEach((item) => {
      if (item._id === true) {
        verified = item.count;
      } else {
        unverified = item.count;
      }
    });

    const totalFoods = verified + unverified;
    const verifiedRate =
      totalFoods > 0 ? Number(((verified / totalFoods) * 100).toFixed(1)) : 0;

    const categoriesDistribution = categoriesResult.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    let pendingUnidentified = 0;
    let resolvedUnidentified = 0;

    unidentifiedStatsResult.forEach((item) => {
      if (item._id === "pending") {
        pendingUnidentified = item.count;
      } else if (item._id === "resolved") {
        resolvedUnidentified = item.count;
      }
    });

    return {
      verification_stats: {
        verified,
        unverified,
        verified_rate: verifiedRate,
      },
      categories_distribution: categoriesDistribution,
      unidentified_foods_stats: {
        total: pendingUnidentified + resolvedUnidentified,
        pending: pendingUnidentified,
        resolved: resolvedUnidentified,
      },
    };
  }

  /**
   * 4. GET RECIPE & MEAL PLAN REPORTS
   * Phân tích công thức món ăn & thực đơn mẫu
   */
  async getRecipeReports() {
    const [sourceResult, statusResult, topRatedRecipes, templateStatsResult] =
      await Promise.all([
        // Phân bố theo nguồn
        Recipe.aggregate([
          {
            $group: {
              _id: "$source_type",
              count: { $sum: 1 },
            },
          },
        ]),

        // Phân bố theo trạng thái duyệt
        Recipe.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        // Top 5 công thức được đánh giá cao nhất (Chỉ lấy các trường an toàn)
        Recipe.find({ status: "approved" })
          .sort({ avg_rating: -1, comment_count: -1, created_at: -1 })
          .limit(5)
          .select("_id title avg_rating comment_count")
          .lean(),

        // Thống kê thực đơn mẫu
        MealPlanTemplate.aggregate([
          {
            $project: {
              itemCount: { $size: { $ifNull: ["$items", []] } },
            },
          },
          {
            $group: {
              _id: null,
              totalTemplates: { $sum: 1 },
              avgItems: { $avg: "$itemCount" },
            },
          },
        ]),
      ]);

    const sourceDistribution = {
      system: 0,
      community: 0,
    };
    sourceResult.forEach((item) => {
      if (sourceDistribution[item._id] !== undefined) {
        sourceDistribution[item._id] = item.count;
      }
    });

    const statusDistribution = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    statusResult.forEach((item) => {
      if (statusDistribution[item._id] !== undefined) {
        statusDistribution[item._id] = item.count;
      }
    });

    const totalTemplates =
      templateStatsResult.length > 0
        ? templateStatsResult[0].totalTemplates
        : 0;
    const avgItemsPerTemplate =
      templateStatsResult.length > 0 && templateStatsResult[0].avgItems !== null
        ? Number(templateStatsResult[0].avgItems.toFixed(1))
        : 0;

    return {
      source_distribution: sourceDistribution,
      status_distribution: statusDistribution,
      top_rated_recipes: topRatedRecipes.map((r) => ({
        _id: r._id,
        title: r.title,
        avg_rating: r.avg_rating || 0,
        comment_count: r.comment_count || 0,
      })),
      meal_plan_templates_summary: {
        total_templates: totalTemplates,
        avg_items_per_template: avgItemsPerTemplate,
      },
    };
  }
}

module.exports = new AdminReportService();
