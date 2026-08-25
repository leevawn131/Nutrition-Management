import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@nutrition_app:onboarding_completed';
const AUTH_TOKEN_KEY = '@nutrition_app:auth_token';
const USER_DATA_KEY = '@nutrition_app:user_data';

/**
 * Check if the user has previously completed the onboarding flow
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding status from storage:', error);
    return false;
  }
}

/**
 * Mark onboarding as completed (stored separately from auth/JWT state)
 */
export async function setOnboardingCompleted(completed: boolean = true): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving onboarding status to storage:', error);
  }
}

/**
 * Reset onboarding status
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status in storage:', error);
  }
}

/**
 * Get stored JWT Auth Token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading auth token from storage:', error);
    return null;
  }
}

/**
 * Store JWT Auth Token
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token to storage:', error);
  }
}

/**
 * Clear stored JWT Auth Token
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth token from storage:', error);
  }
}

/**
 * Get cached user data
 */
export async function getCachedUser(): Promise<any | null> {
  try {
    const json = await AsyncStorage.getItem(USER_DATA_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Error reading user data from storage:', error);
    return null;
  }
}

/**
 * Set cached user data
 */
export async function setCachedUser(user: any): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data to storage:', error);
  }
}

/**
 * Clear cached user data
 */
export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing user data from storage:', error);
  }
}

/**
 * Clear all authentication and cached user data (used for logout)
 */
export async function clearAuthData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  } catch (error) {
    console.error('Error clearing auth data from storage:', error);
  }
}
