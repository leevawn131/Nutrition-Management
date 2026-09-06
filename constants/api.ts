import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically determine the local computer IP address for Expo Go on physical mobile devices
 */
const getLocalHostIp = (): string => {
  // Expo Go provides the debugger Host IP (e.g. 192.168.1.x:8081)
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

  // Fallback for Android Emulator (10.0.2.2) or iOS Simulator / Web (localhost)
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

/**
 * Base API URL for backend services
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${getLocalHostIp()}:5000/api`;
