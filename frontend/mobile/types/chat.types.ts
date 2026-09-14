export type ChatInputType = 'text' | 'choice' | 'number' | 'confirm' | 'action';

export interface ChatInput {
  type: ChatInputType;
  value: any;
}

export type ChatFlow = 'general' | 'recipe' | 'meal_plan' | 'goal' | 'exercise' | 'health';

export type ChatFlowStatus =
  | 'collecting'
  | 'processing'
  | 'waiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface ChatState {
  flow: ChatFlow;
  step: string;
  status: ChatFlowStatus;
}

export interface ChatChoiceItem {
  label: string;
  value: any;
  icon?: string;
}

export interface ChatChoicePayload {
  title?: string;
  choices: ChatChoiceItem[];
}

export interface ChatRecipeAction {
  label: string;
  action: 'view_recipe' | 'save_recipe' | 'add_to_meal_plan' | string;
  data: any;
}

export interface ChatRecipeItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  cook_time_minutes?: number;
  prep_time_minutes?: number;
  servings?: number;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  ingredients?: Array<{ ingredient_name: string; quantity?: number; unit?: string }>;
  steps?: Array<{ step_number: number; instruction: string; image_url?: string }>;
  actions?: ChatRecipeAction[];
}

export interface ChatRecipeListPayload {
  title: string;
  recipes: ChatRecipeItem[];
}

export interface ChatRecipeDetailPayload {
  recipe: ChatRecipeItem & {
    description?: string;
    ingredients?: Array<{ ingredient_name: string; quantity?: number; unit?: string }>;
    steps?: Array<{ step_number: number; instruction: string; image_url?: string }>;
  };
}

export interface ChatMealPlanMealItem {
  meal_type: string;
  title: string;
  recipe_id?: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  image_url?: string;
  description?: string;
  ingredients?: Array<{ ingredient_name: string; quantity?: number; unit?: string }>;
  steps?: Array<{ step_number: number; instruction: string; image_url?: string }>;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
}

export interface ChatMealPlanDay {
  date: string;
  day_label: string;
  day_calories: number;
  day_protein_g?: number;
  day_carbs_g?: number;
  day_fat_g?: number;
  meals: ChatMealPlanMealItem[];
}

export interface ChatMealPlanPreviewPayload {
  plan_period: string;
  target_calories_per_day?: number;
  average_calories: number;
  days: ChatMealPlanDay[];
  explanation?: string;
  nutrition_summary?: {
    avg_calories: number;
    target_calories?: number;
    avg_protein_g: number;
    avg_carbs_g: number;
    avg_fat_g: number;
    protein_pct: number;
    carb_pct: number;
    fat_pct: number;
    water_liters?: string;
    fiber_g?: string;
  };
}

export interface ChatConfirmPayload {
  success: boolean;
  saved_count: number;
  period?: string;
}

export type ChatUIType =
  | 'choice'
  | 'number'
  | 'recipe_list'
  | 'recipe_detail'
  | 'meal_plan_preview'
  | 'confirm'
  | 'result'
  | null;

export interface ChatUIResponse {
  type: ChatUIType;
  payload: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ui?: ChatUIResponse | null;
  created_at: string;
  isSending?: boolean;
}

export interface ChatSendResponseData {
  conversation_id: string;
  message: ChatMessage;
  ui?: ChatUIResponse | null;
  state: ChatState;
}

export interface ChatSendResponse {
  success: boolean;
  data: ChatSendResponseData;
  message?: string;
}

export interface ChatConversationSummary {
  _id: string;
  title: string;
  current_flow: ChatFlow;
  current_step: string;
  status: ChatFlowStatus;
  created_at: string;
  updated_at: string;
}

