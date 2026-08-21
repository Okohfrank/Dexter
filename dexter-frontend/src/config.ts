/**
 * Backend API configuration for the Dexter app.
 *
 * Dynamically resolves API base URL based on runtime environment
 * (Web browser, iOS/Android emulator, physical device via Expo hostUri).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  // 1. Explicit extra.apiBaseUrl from app.json if present
  const extraBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  // 2. Web browser: connect directly to the current host on port 8000
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:8000/api/v1`;
  }

  // 3. Expo Host URI (automatic resolution for physical devices on local network)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000/api/v1`;
    }
  }

  // 4. Use app.json extra config if available
  if (extraBaseUrl && typeof extraBaseUrl === 'string' && extraBaseUrl.startsWith('http')) {
    return extraBaseUrl;
  }

  // 5. Default fallback to detected LAN IP
  return 'http://172.20.10.3:8000/api/v1';
}

export const API_BASE_URL: string = resolveBaseUrl();
