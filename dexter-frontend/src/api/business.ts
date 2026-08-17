/** Businesses API wrappers (backend: /api/v1/businesses). */
import { apiFetch, getApiError } from './client';
import type { Business } from '../types';

export async function createBusiness(
  data: { name: string; industry?: string; description?: string; website?: string },
): Promise<Business> {
  const res = await apiFetch('/businesses/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not create business');
  }
  return (await res.json()) as Business;
}

export async function listBusinesses(): Promise<Business[]> {
  const res = await apiFetch('/businesses/', { method: 'GET' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not load businesses');
  }
  return (await res.json()) as Business[];
}

export async function updateBusiness(
  businessId: string,
  data: Partial<{ name: string; industry: string; description: string; website: string }>,
): Promise<Business> {
  const res = await apiFetch(`/businesses/${businessId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not update business');
  }
  return (await res.json()) as Business;
}