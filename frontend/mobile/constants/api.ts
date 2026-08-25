import { Platform } from 'react-native';

/**
 * Base API URL for backend services
 * Default fallback to localhost for Web/iOS and 10.0.2.2 for Android Emulator
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');
