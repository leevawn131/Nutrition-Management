import { Platform } from 'react-native';

/**
 * Base API URL for backend services
 * Priority:
 * 1) EXPO_PUBLIC_API_URL (Expo public env)
 * 2) API_BASE_URL (legacy project env)
 * 3) Platform fallback (localhost / Android emulator)
 */
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL;

const getWebFallbackApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${window.location.hostname}:5000/api`;
};

export const API_BASE_URL =
  ENV_API_URL ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : Platform.OS === 'web'
      ? getWebFallbackApiUrl()
      : 'http://localhost:5000/api');
