import Constants from 'expo-constants';
import { Platform } from 'react-native';

const CURRENT_WIFI_IP = '192.168.1.207';

const getLocalHostIp = (): string => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return CURRENT_WIFI_IP;
  }

  return 'localhost';
};

const getWebFallbackApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${window.location.hostname}:5000/api`;
};

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL;

export const API_BASE_URL =
  Platform.OS === 'web'
    ? getWebFallbackApiUrl()
    : ENV_API_URL ||
      (Platform.OS === 'android'
        ? `http://10.0.2.2:5000/api`
        : `http://${getLocalHostIp()}:5000/api`);
