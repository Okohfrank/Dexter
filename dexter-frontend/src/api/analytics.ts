/**
 * Analytics and Published Posts API service.
 */
import { apiFetch } from './client';
import type { PublishedPost, LearningInsight } from '../types';

export const FALLBACK_PUBLISHED_POSTS: PublishedPost[] = [
  {
    id: 'pub-post-1',
    platform: 'linkedin',
    content_text:
      'AI is not replacing your marketing team — it is giving every founder an autonomous employee that never misses a posting window. Here is how we think about autonomous brand building: #AI #Automation #Founders',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    caption_variant: 'Thought-leadership / Founder POV',
    media_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
    media_type: 'image',
    author_name: 'Alex Mercer',
    author_headline: 'Founder & CEO • Dexter AI',
    performance: { impressions: 2480, likes: 312, comments: 48, shares: 62, clicks: 128 },
  },
  {
    id: 'pub-post-2',
    platform: 'linkedin',
    content_text:
      'The 3 mistakes every B2B startup makes on LinkedIn:\n\n1. Inconsistent cadence\n2. Talking only about product features instead of customer problems\n3. Treating posts like press releases rather than conversation starters.\n\n#ContentStrategy #Growth #SaaS',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    caption_variant: 'Framework / How-To',
    author_name: 'Alex Mercer',
    author_headline: 'Founder & CEO • Dexter AI',
    performance: { impressions: 1420, likes: 165, comments: 27, shares: 34, clicks: 81 },
  },
];

export const FALLBACK_LEARNING_INSIGHTS: LearningInsight[] = [
  {
    id: 'learn-1',
    generated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    summary:
      'Posts beginning with a numbered question achieve 2.4x higher comment engagement. Dexter is optimizing future hooks with question frameworks.',
    relatedGoal: 'Grow LinkedIn following to 1,000 in 90 days',
  },
  {
    id: 'learn-2',
    generated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    summary:
      'Tuesday & Thursday 8:30 AM posts deliver 42% higher impression velocity than afternoon posts.',
    relatedGoal: 'Generate inbound B2B pipeline',
  },
];

export async function getPublishedPosts(businessId?: string): Promise<PublishedPost[]> {
  if (!businessId) return FALLBACK_PUBLISHED_POSTS;
  try {
    const res = await apiFetch(`/publish/history?business_id=${businessId}`, {
      method: 'GET',
    });
    if (!res.ok) return FALLBACK_PUBLISHED_POSTS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PUBLISHED_POSTS;
  } catch {
    return FALLBACK_PUBLISHED_POSTS;
  }
}

export async function getLearningInsights(businessId?: string): Promise<LearningInsight[]> {
  if (!businessId) return FALLBACK_LEARNING_INSIGHTS;
  try {
    const res = await apiFetch(`/analytics/learnings?business_id=${businessId}`, {
      method: 'GET',
    });
    if (!res.ok) return FALLBACK_LEARNING_INSIGHTS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_LEARNING_INSIGHTS;
  } catch {
    return FALLBACK_LEARNING_INSIGHTS;
  }
}
