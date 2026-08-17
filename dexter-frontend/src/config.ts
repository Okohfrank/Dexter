/**
 * Backend API configuration for the Dexter app.
 *
 * The base URL is configured via app.json under `expo.extra.apiBaseUrl`
 * so a device on the same LAN can reach the backend (localhost won't work
 * from a phone). Override it for staging/production builds as needed.
 */
import Constants from 'expo-constants';

const fallback = 'http://localhost:8000/api/v1';

function resolveBaseUrl(): string {
  // expo-constants v18 exposes expoConfig (preferred); manifest is legacy.
  const extra: any =
    (Constants as any).expoConfig?.extra ??
    (Constants as any).manifest?.extra ??
    {};
  const url =
    typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl.length > 0
      ? extra.apiBaseUrl
      : fallback;
  return url.replace(/\/+$/, '');
}

export const API_BASE_URL: string = resolveBaseUrl();
