import { FoodItem, MealType, Recipe } from './plan.types';

export interface MealLog {
  _id: string;
  user_id: string;
  food_item_id?: string | FoodItem | null;
  input_method: 'photo' | 'gallery' | 'text';
  source_image_url?: string | null;
  description_text?: string | null;
  portion_label?: 'small' | 'medium' | 'large' | null;
  portion_grams?: number | null;
  calories: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  meal_type: MealType;
  logged_at: string;
  created_at: string;
}

export interface MacroTarget {
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}

export interface DailySummary {
  date: string;
  consumed: {
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  targets: MacroTarget;
  remaining: {
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  percentages: {
    calories: number;
    protein: number;
    carb: number;
    fat: number;
  };
  burned: {
    calories: number;
    minutes: number;
  };
  mealsByType: {
    breakfast: MealLog[];
    lunch: MealLog[];
    dinner: MealLog[];
    snack: MealLog[];
  };
  mealLogsCount: number;
  loggedMealTypesCount: number;
  plannedCount: number;
  completedPlannedCount: number;
  planCompletionPercent: number;
}

export interface DayStatistics {
  date: string;
  dayOfWeek: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  durationMinutes: number;
  mealLogsCount: number;
  hasActivity: boolean;
  hasMeal: boolean;
  plannedCount: number;
  completedCount: number;
  completionRate: number;
}

export interface PeriodStatistics {
  rangeDays: number;
  activeDaysCount: number;
  loggedDaysCount: number;
  totalPlannedCount: number;
  completedPlannedCount: number;
  planCompletionPercent: number;
  targetCalories: number;
  days: DayStatistics[];
}
