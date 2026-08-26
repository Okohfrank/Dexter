/**
 * Minimal fetch-based API client with an in-memory auth store.
 *
 * Tokens are held in a Zustand store (sync, in-memory). Swap in
 * `expo-secure-store` / `AsyncStorage` later if you need persistence.
 */
import { API_BASE_URL } from '../config';
import { create } from 'zustand';

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (auth: { user: User; access_token: string; refresh_token: string }) => void;
  clearAuth: () => void;
  setTokens: (tokens: { access_token: string; refresh_token: string }) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: ({ user, access_token, refresh_token }) =>
    set({ user, accessToken: access_token, refreshToken: refresh_token }),
  setTokens: ({ access_token, refresh_token }) =>
    set({ accessToken: access_token, refreshToken: refresh_token }),
  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
}));

export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const url = input.startsWith('http') ? input : `${API_BASE_URL}${input}`;
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Force application/json ONLY for JSON/string bodies, NEVER for FormData multipart uploads
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (init?.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 25-second timeout for mobile networks and AI / Whisper processing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out. Please ensure the backend server is reachable.');
    }
    throw error;
  }
}

/**
 * Builds a readable Error from a FastAPI error response.
 * FastAPI validation failures return `detail` as an array of objects
 * ({loc, msg}), which stringifies to "[object Object]" otherwise.
 */
export async function getApiError(res: Response, fallback: string): Promise<Error> {
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (e.g. 500 plain text); fall back.
  }
  const detail = body?.detail;
  let message = fallback;
  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((item: any) => {
        if (item?.msg) {
          const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
          return loc ? `${loc}: ${item.msg}` : item.msg;
        }
        return JSON.stringify(item);
      })
      .join('; ');
  } else if (detail && typeof detail === 'object') {
    message = JSON.stringify(detail);
  }
  return new Error(message);
}
