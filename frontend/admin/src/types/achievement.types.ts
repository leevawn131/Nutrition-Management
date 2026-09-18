export type AchievementConditionType =
  | "points"
  | "streak"
  | "posts"
  | "comments"
  | "likes_received"
  | "friends"
  | "meal_logs"
  | "distinct_meal_days"
  | "recipes"
  | "unlocked_badges"
  | "custom";

export interface AchievementCondition {
  type: AchievementConditionType;
  threshold: number;
}

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  tier?: string;
  category?: string;
  reward_points?: number;
  condition: AchievementCondition;
  created_at: string;
  updated_at?: string;
}

export interface AchievementPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AchievementListResponse {
  success: boolean;
  message: string;
  data: {
    achievements: Achievement[];
    pagination: AchievementPagination;
    conditionTypes: AchievementConditionType[];
  };
}

export interface AchievementDetailResponse {
  success: boolean;
  message: string;
  data: {
    achievement: Achievement;
  };
}

export interface MutateAchievementResponse {
  success: boolean;
  message: string;
  data?: {
    achievement: Achievement;
  };
}

export interface CreateAchievementPayload {
  name: string;
  description: string;
  icon: string;
  condition: {
    type: AchievementConditionType;
    threshold: number;
  };
}

export interface UpdateAchievementPayload {
  name?: string;
  description?: string;
  icon?: string;
  condition?: {
    type?: AchievementConditionType;
    threshold?: number;
  };
}

export interface AchievementListParams {
  page?: number;
  limit?: number;
  search?: string;
  condition_type?: string;
}
