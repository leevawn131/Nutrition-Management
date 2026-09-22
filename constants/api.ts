import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Active Wi-Fi IPv4 address on local network
 */
const CURRENT_WIFI_IP = '192.168.1.101';

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
    // Filter out virtual network adapters (VirtualBox 192.168.56.x, Hyper-V 172.x.x.x)
    if (
      ip &&
      ip !== 'localhost' &&
      ip !== '127.0.0.1' &&
      !ip.startsWith('192.168.56.') &&
      !ip.startsWith('172.')
    ) {
      return ip;
    }
  }

  // Use active Wi-Fi IP for physical devices, else emulator / web fallback
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return CURRENT_WIFI_IP;
  }

  return 'localhost';
};

/**
 * Base API URL for backend services
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${getLocalHostIp()}:5000/api`;
