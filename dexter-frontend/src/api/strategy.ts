/**
 * Strategy API service connecting to backend /api/v1/strategy endpoints.
 */
import { apiFetch, getApiError } from './client';
import type { ContentPlan } from '../types';

export const FALLBACK_STRATEGY: ContentPlan = {
  id: 'strategy-default',
  business_id: 'biz-default',
  frequencyPerWeek: 4,
  platformMix: { linkedin: 4 },
  pillars: [
    'Founder Thought Leadership & POV',
    'Product Milestones & Technical Deep-dives',
    'Actionable Industry Frameworks',
    'Customer Wins & Social Proof',
  ],
  bestTimes: ['Tue 8:30 AM', 'Thu 10:15 AM', 'Sat 11:00 AM'],
  notes: 'Schedule 4 LinkedIn posts per week targeted at mid-morning executive peak windows.',
};

export async function generateContentStrategy(businessId?: string): Promise<ContentPlan> {
  if (!businessId) return FALLBACK_STRATEGY;

  try {
    const res = await apiFetch(`/strategy/${businessId}/generate`, { method: 'POST' });
    if (res.ok) {
      return (await res.json()) as ContentPlan;
    }
  } catch {
    // Return fallback if network fails
  }

  return FALLBACK_STRATEGY;
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
