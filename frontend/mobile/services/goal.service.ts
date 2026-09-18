import { API_BASE_URL } from '@/constants/api';
import { User } from '@/types/auth.types';

export interface GoalRecommendationRequest {
  goal: 'lose' | 'maintain' | 'gain';
  target_weight?: number;
  target_duration_weeks?: number;
}

export interface GoalRecommendationData {
  goal: string;
  recommendedTargetCalories: number;
  targetWeightKg?: number;
  targetDurationWeeks?: number;
  weeklyWeightChangeKg?: number;
  dailyCalorieAdjustment?: number;
  tdee: number;
}

export interface GoalConfirmRequest {
  goal: 'lose' | 'maintain' | 'gain';
  target_weight?: number;
  target_duration_weeks?: number;
  target_calories: number;
}

export interface GoalRecommendationResponse {
  success: boolean;
  message?: string;
  data: {
    recommendation: GoalRecommendationData;
  };
}

export interface GoalConfirmResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface MicronutrientItem {
  id: string;
  key?: string;
  name: string;
  amount: number;
  target: number;
  unit: string;
  status: 'optimal' | 'deficient' | 'excessive';
  statusLabel: string;
  statusColor: string;
  percent: number;
  comment: string;
}

export interface MealComparisonItem {
  mealType: string;
  mealLabel: string;
  targetCalories: number;
  plannedDish: string;
  actualLoggedDish: string;
  actualCalories: number;
  status: 'matched' | 'deviated' | 'skipped' | 'extra';
  statusLabel: string;
  statusColor: string;
}

export interface NutrientAssessmentItem {
  name: string;
  actual: number;
  target: number;
  unit: string;
  status: 'optimal' | 'low' | 'high';
  statusLabel: string;
  statusColor: string;
  evaluation: string;
}

export interface DayMealAnalysis {
  planAdherence: {
    planAdherencePercent: number;
    title: string;
    color: string;
    verdict: string;
    mealsComparison: MealComparisonItem[];
  };
  nutrientsAssessment: NutrientAssessmentItem[];
  actionableAdvice: string[];
}

export interface AIMealAnalysisResult {
  modelUsed: string;
  aiDoctorVerdict: string;
  nutritionCritique: string;
  actionableSteps: string[];
  proTip: string;
}

export interface GoalAIProposal {
  goal: 'lose' | 'maintain' | 'gain';
  targetCalories: number;
  targetProteinG: number;
  targetCarbG: number;
  targetFatG: number;
  targetWeightKg?: number;
  weeklyChangeKg?: number;
  explanation: string;
}

export interface GoalAIChatResult {
  modelUsed: string;
  message: string;
  hasProposal: boolean;
  proposal: GoalAIProposal | null;
  suggestedQuickReplies: string[];
}

export interface DietQualityScore {
  score: number;
  grade: string;
  gradeColor: string;
  label: string;
  summary: string;
  breakdown: {
    calorieScore: number;
    macroScore: number;
    microScore: number;
    adherenceScore: number;
  };
}

export interface GoalAdherenceDay {
  date: string;
  dayOfWeek: string;
  caloriesConsumed: number;
  targetCalories: number;
  proteinConsumed: number;
  carbConsumed: number;
  fatConsumed: number;
  caloriesBurned: number;
  plannedCount: number;
  completedPlannedCount: number;
  planCompletionPercent: number;
  status: 'on_track' | 'over_target' | 'under_target' | 'missed_plan' | 'not_logged';
  statusLabel: string;
  statusColor: string;
  statusMessage: string;
  isDeviated: boolean;
  micronutrients?: MicronutrientItem[];
  mealAnalysis?: DayMealAnalysis;
  dietQualityScore?: DietQualityScore;
}

export interface SuggestedPlan {
  suggestedTargetCalories: number;
  currentCalories: number;
  macros: {
    targetProteinG: number;
    targetCarbG: number;
    targetFatG: number;
  };
  goal?: string;
  adjustmentType: string;
  reason: string;
  templates: {
    _id: string;
    name: string;
    description?: string;
    duration_days?: number;
    image_url?: string;
  }[];
}

export interface GoalAdherenceData {
  userId: string;
  userGoal?: string;
  targetCalories: number;
  targetMacros: {
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  numDays: number;
  adherenceRate: number;
  currentOnTrackStreak: number;
  consecutiveDeviatedDays: number;
  needsAdjustmentConfirmation: boolean;
  summary: {
    onTrackDaysCount: number;
    overTargetCount: number;
    underTargetCount: number;
    missedPlanCount: number;
  };
  days: GoalAdherenceDay[];
  suggestedPlan: SuggestedPlan;
}

export interface ApplyGoalToPlanPayload {
  goal?: 'lose' | 'maintain' | 'gain';
  target_calories?: number;
  target_protein_g?: number;
  target_carb_g?: number;
  target_fat_g?: number;
  target_weight?: number;
  template_id?: string;
  start_date?: string;
  days_count?: number;
}

export const goalService = {
  /**
   * Request recommended target calories from backend
   */
  async recommendGoal(
    token: string,
    payload: GoalRecommendationRequest
  ): Promise<GoalRecommendationData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/recommend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: GoalRecommendationResponse = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data.recommendation;
      }
      console.warn('recommendGoal API response not ok:', data);
      return null;
    } catch (error) {
      console.warn('Error in recommendGoal API:', error);
      return null;
    }
  },

  /**
   * Confirm and save the goal + target calories
   */
  async confirmGoal(token: string, payload: GoalConfirmRequest): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/confirm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: GoalConfirmResponse = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data.user;
      }
      console.warn('confirmGoal API response not ok:', data);
      return null;
    } catch (error) {
      console.warn('Error in confirmGoal API:', error);
      return null;
    }
  },

  /**
   * Get goal maintenance progress and suggested adjustment
   */
  async getGoalAdherence(token: string, days = 7): Promise<GoalAdherenceData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/adherence?days=${days}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data;
      }
      console.warn('getGoalAdherence API response not ok:', data);
      return null;
    } catch (error) {
      console.warn('Error in getGoalAdherence API:', error);
      return null;
    }
  },

  /**
   * Apply goal parameters to meal plans
   */
  async applyGoalToPlan(token: string, payload: ApplyGoalToPlanPayload): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/apply-to-plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return {
        success: response.ok && data.success,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.warn('Error in applyGoalToPlan API:', error);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * Confirm adherence adjustment when over 3 days off-track
   */
  async confirmAdherenceAdjustment(
    token: string,
    payload: { action: 'accept_suggestion' | 'keep_current'; new_target_calories?: number; template_id?: string }
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/adherence/confirm-adjustment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return {
        success: response.ok && data.success,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.warn('Error in confirmAdherenceAdjustment API:', error);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * Request Gemini 3.5 Flash meal analysis & clinical advice for a day
   */
  async getAIMealAnalysis(
    token: string,
    date: string
  ): Promise<{ success: boolean; data?: AIMealAnalysisResult; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/meal-analysis/ai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      const data = await response.json();
      return {
        success: response.ok && data.success,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.warn('Error in getAIMealAnalysis API:', error);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * Conversational Goal Consultation with Gemini 3.5 Flash
   */
  async chatGoalConsultation(
    token: string,
    payload: {
      messages: Array<{ sender: 'user' | 'ai'; text: string }>;
      userMessage: string;
    }
  ): Promise<{ success: boolean; data?: GoalAIChatResult; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/ai-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return {
        success: response.ok && data.success,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.warn('Error in chatGoalConsultation API:', error);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },
};

