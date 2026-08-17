/**
 * First-class domain types mirroring the backend's planned data model (PRD §5).
 * Screens render these; mocked data and live API responses both conform to them
 * so swapping mock -> live is a data-source change, not a rewrite.
 */

export type Platform = 'linkedin' | 'instagram' | 'tiktok';

export type PostStatus =
  | 'draft'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export type MediaType = 'image' | 'video' | 'document';

export type Business = {
  id: string;
  user_id: string;
  name: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  is_active: boolean;
  created_at: string;
};

/** The structured "Business Brain" distilled from the interview. */
export type BusinessBrain = {
  industry: string;
  products: string[];
  audience: string[];
  goals: string[];
  brandVoice: string;
  restrictions: string[];
  writingStyle: string;
  visualStyle: string;
  preferredHashtags: string[];
  preferredCtas: string[];
};

export type ConnectedAccount = {
  id: string;
  business_id: string;
  platform: Platform;
  platform_user_id: string;
  display_name?: string | null;
  profile_url?: string | null;
  is_active: boolean;
  /** OAuth token health — 'expired' matters and must be surfaced (PRD §3.1). */
  token_status?: 'valid' | 'expired' | 'unknown' | null;
  created_at: string;
};

export type MediaAsset = {
  id: string;
  business_id: string;
  file_name: string;
  media_type: MediaType;
  url: string;
  tags: string[];
  created_at: string;
};

/** Content strategy: what Dexter will post, where, and how often. */
export type ContentPlan = {
  id: string;
  business_id: string;
  frequencyPerWeek: number;
  platformMix: Partial<Record<Platform, number>>;
  pillars: string[];
  bestTimes: string[];
  notes: string;
};

export type ScheduledPost = {
  id: string;
  content_text: string;
  scheduled_for: string;
  status: PostStatus;
  platform_post_type: string;
};

export type PostPerformance = {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
};

export type PublishedPost = {
  id: string;
  platform: Platform;
  content_text: string;
  published_at: string;
  /** Platform-specific caption variant (PRD §6). */
  caption_variant: string;
  performance: PostPerformance;
};

/** Plain-language insight tied back to a user goal (not raw analytics). */
export type LearningInsight = {
  id: string;
  generated_at: string;
  summary: string;
  relatedGoal: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatBrief = {
  topic: string;
  content_text: string;
  image_url?: string | null;
  suggested_hashtags: string[];
  call_to_action?: string | null;
  recommended_time?: string | null;
};

export type ChatResponse = {
  reply: string;
  is_finalized: boolean;
  brief?: ChatBrief | null;
  published_post_id?: string | null;
};