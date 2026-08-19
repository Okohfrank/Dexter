/**
 * Strategy API client for content plan generation and retrieval.
 */
import { apiFetch, getApiError } from './client';
import type { ContentPlan } from '../types';

export const FALLBACK_STRATEGY: ContentPlan = {
  id: 'strategy-derived-plan',
  business_id: 'default',
  frequencyPerWeek: 4,
  platformMix: { linkedin: 4 },
  pillars: [
    'Founder Thought Leadership & POV',
    'Product Milestones & Feature Deep-dives',
    'Actionable Industry Frameworks',
    'Customer Stories & Social Proof',
  ],
  bestTimes: ['Tue 8:30 AM', 'Thu 10:15 AM', 'Sat 11:00 AM'],
  notes:
    'Start with 4 LinkedIn posts/week during mid-morning peak engagement windows. Expand to Instagram once the adapter goes live.',
};

export async function generateContentStrategy(businessId?: string): Promise<ContentPlan> {
  if (!businessId) return FALLBACK_STRATEGY;
  try {
    const res = await apiFetch(`/strategy/${businessId}/generate`, {
      method: 'POST',
    });
    if (!res.ok) {
      return FALLBACK_STRATEGY;
    }
    return (await res.json()) as ContentPlan;
  } catch {
    return FALLBACK_STRATEGY;
  }
}

export async function getContentStrategy(businessId?: string): Promise<ContentPlan> {
  if (!businessId) return FALLBACK_STRATEGY;
  try {
    const res = await apiFetch(`/strategy/${businessId}`, {
      method: 'GET',
    });
    if (!res.ok) {
      return FALLBACK_STRATEGY;
    }
    return (await res.json()) as ContentPlan;
  } catch {
    return FALLBACK_STRATEGY;
  }
}
