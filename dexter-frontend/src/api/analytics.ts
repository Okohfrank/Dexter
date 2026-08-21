/**
 * Analytics API service connecting to backend /api/v1/analytics endpoints.
 */
import { apiFetch } from './client';
import type { PublishedPost, LearningInsight } from '../types';

export async function getPublishedPosts(businessId?: string): Promise<PublishedPost[]> {
  try {
    const qs = businessId ? `?business_id=${businessId}` : '';
    const res = await apiFetch(`/analytics/history${qs}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as PublishedPost[];
    }
  } catch {
    // Graceful fallback to empty list
  }
  return [];
}

export async function getLearningInsights(businessId?: string): Promise<LearningInsight[]> {
  try {
    const qs = businessId ? `?business_id=${businessId}` : '';
    const res = await apiFetch(`/analytics/learnings${qs}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as LearningInsight[];
    }
  } catch {
    // Graceful fallback to empty list
  }
  return [];
}
