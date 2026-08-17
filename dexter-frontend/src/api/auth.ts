/** Auth API wrappers matching the backend's /api/v1/auth endpoints. */
import { apiFetch, getApiError } from './client';
import type { User } from './client';

export type AuthResponse = {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function register(
  email: string,
  password: string,
  full_name: string,
): Promise<AuthResponse> {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Registration failed');
  }
  return (await res.json()) as AuthResponse;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Login failed');
  }
  return (await res.json()) as TokenResponse;
}

export async function verifyEmail(token: string): Promise<User> {
  const res = await apiFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Verification failed');
  }
  return (await res.json()) as User;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await apiFetch('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not resend verification email');
  }
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await apiFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Token refresh failed');
  }
  return (await res.json()) as TokenResponse;
}

export async function getMe(): Promise<User> {
  const res = await apiFetch('/auth/me', { method: 'GET' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not load profile');
  }
  return (await res.json()) as User;
}

export async function getLinkedInAuthorizationUrl(businessId: string): Promise<{ authorization_url: string; state: string }> {
  const res = await apiFetch(`/oauth/linkedin/authorize?business_id=${businessId}`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not start LinkedIn OAuth');
  }
  return (await res.json()) as { authorization_url: string; state: string };
}