/** OAuth/connected-account API wrappers (backend: /api/v1/oauth). */
import { apiFetch, getApiError } from './client';
import type { ConnectedAccount } from '../types';

export async function listConnectedAccounts(businessId: string): Promise<ConnectedAccount[]> {
  const res = await apiFetch(`/oauth/accounts?business_id=${businessId}`, { method: 'GET' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not load connected accounts');
  }
  return (await res.json()) as ConnectedAccount[];
}