export type Timeframe = "7d" | "30d" | "90d" | "1y" | "all";

export interface OverviewKPIs {
  total_users: number;
  total_foods: number;
  total_recipes: number;
  total_meal_plan_templates: number;
  total_meal_logs: number;
  pending_recipes: number;
  pending_unidentified_foods: number;
}

export interface OverviewReportResponse {
  success: boolean;
  message?: string;
  data: {
    kpis: OverviewKPIs;
  };
}

export interface RegistrationTrendItem {
  date: string;
  count: number;
}

export interface GoalsDistribution {
  lose: number;
  maintain: number;
  gain: number;
  unspecified: number;
}

export interface ActivityLevelDistribution {
  sedentary: number;
  light: number;
  moderate: number;
  active: number;
  very_active: number;
  unspecified: number;
}

export interface RolesDistribution {
  user: number;
  admin: number;
}

export interface UserReportsData {
  registration_trend: RegistrationTrendItem[];
  goals_distribution: GoalsDistribution;
  activity_level_distribution: ActivityLevelDistribution;
  roles_distribution: RolesDistribution;
}

export interface UserReportsResponse {
  success: boolean;
  message?: string;
  data: UserReportsData;
}

export interface FoodVerificationStats {
  verified: number;
  unverified: number;
  verified_rate: number;
}

export interface FoodCategoryItem {
  category: string;
  count: number;
}

export interface UnidentifiedFoodsStats {
  total: number;
  pending: number;
  resolved: number;
}

export interface FoodReportsData {
  verification_stats: FoodVerificationStats;
  categories_distribution: FoodCategoryItem[];
  unidentified_foods_stats: UnidentifiedFoodsStats;
}

export interface FoodReportsResponse {
  success: boolean;
  message?: string;
  data: FoodReportsData;
}

export interface RecipeSourceDistribution {
  system: number;
  community: number;
}

export interface RecipeStatusDistribution {
  approved: number;
  pending: number;
  rejected: number;
}

export interface TopRatedRecipe {
  _id: string;
  title: string;
  avg_rating: number;
  comment_count: number;
}

export interface MealPlanTemplatesSummary {
  total_templates: number;
  avg_items_per_template: number;
}

export interface RecipeReportsData {
  source_distribution: RecipeSourceDistribution;
  status_distribution: RecipeStatusDistribution;
  top_rated_recipes: TopRatedRecipe[];
  meal_plan_templates_summary: MealPlanTemplatesSummary;
}

export interface RecipeReportsResponse {
  success: boolean;
  message?: string;
  data: RecipeReportsData;
}
