/**
 * Strategy API service connecting to backend /api/v1/strategy endpoints.
 */
import { apiFetch, getApiError } from './client';
import type { ContentPlan } from '../types';

export async function generateContentStrategy(businessId?: string): Promise<ContentPlan | null> {
  if (!businessId) return null;

  try {
    const res = await apiFetch(`/strategy/${businessId}/generate`, { method: 'POST' });
    if (res.ok) {
      return (await res.json()) as ContentPlan;
    }
  } catch {
    // Return null so screens show an honest empty state
  }

  return null;
}

export async function generateNextPost(
  businessId: string,
  topicOverride?: string,
): Promise<{ status: string; post_id: string; content_text: string; scheduled_for?: string }> {
  const res = await apiFetch('/strategy/generate-next', {
    method: 'POST',
    body: JSON.stringify({
      business_id: businessId,
      topic_override: topicOverride,
    }),
  });

  if (!res.ok) {
    throw await getApiError(res, 'Could not generate autonomous post');
  }

  return await res.json();
}