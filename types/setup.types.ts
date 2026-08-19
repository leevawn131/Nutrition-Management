/**
 * Setup Wizard Shared State Interface
 * Note: Not all fields are saved to MongoDB. Some are temporary calculation inputs.
 */
export interface SetupWizardState {
  // Goal & Intent
  goalIntent?: 'weight_control' | 'medical_support' | 'healthy_lifestyle';
  goal?: 'lose' | 'maintain' | 'gain';

  // Physical & Demographic Profile (Module A persistent)
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string; // YYYY-MM-DD
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  // Temporary Calculation-only values (DISCARDED after setup, NOT saved in MongoDB)
  body_fat?: number;
  waist?: number;
  hip?: number;
  body_type?: string;

  // Temporary Goal Calculation Inputs (used for POST /api/goal/recommend, NOT saved in MongoDB)
  target_weight?: number;
  target_duration_weeks?: number;

  // Temporary Branching Flags
  hasBodyMeasurements?: boolean;
  shareNutritionPreferences?: boolean;

  // Calculation & Recommendation outputs
  recommended_calories?: number;
  tdee?: number;

  // Nutrition Preferences (Module A persistent via food_preferences[])
  diet_type?: string;
  cuisine_preferences?: string[];
  allergies?: string[];
  dislikes?: string[];

  // Optional UI-only referral code (DISCARDED, NOT saved in MongoDB)
  referral_code?: string;
}

export interface SetupContextType {
  wizardData: SetupWizardState;
  updateWizardData: (data: Partial<SetupWizardState>) => void;
  resetWizardData: () => void;
}
