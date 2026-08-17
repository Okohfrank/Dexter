/** Publishing API wrappers (backend: /api/v1/publish). */
import { apiFetch, getApiError } from './client';
import type { ScheduledPost, PostStatus } from '../types';

export type PublishResponse = {
  post_id: string;
  status: PostStatus;
  scheduled_for?: string | null;
};

export type PostStatusResponse = {
  post_id: string;
  status: PostStatus;
  platform?: string | null;
  published_at?: string | null;
  error_message?: string | null;
};

export async function publishPost(data: {
  platform: string;
  content_text: string;
  connected_account_id: string;
  scheduled_for?: string;
  media_asset_ids?: string[];
}): Promise<PublishResponse> {
  const res = await apiFetch('/publish/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not publish');
  }
  return (await res.json()) as PublishResponse;
}

export async function getPostStatus(postId: string): Promise<PostStatusResponse> {
  const res = await apiFetch(`/publish/${postId}/status`, { method: 'GET' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not load post status');
  }
  return (await res.json()) as PostStatusResponse;
}

export async function getScheduledPosts(connectedAccountId: string): Promise<ScheduledPost[]> {
  const res = await apiFetch(`/publish/account/${connectedAccountId}`, { method: 'GET' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not load scheduled posts');
  }
  return (await res.json()) as ScheduledPost[];
}

export async function updateScheduledPost(
  postId: string,
  data: { content_text?: string; scheduled_for?: string; platform?: string },
): Promise<ScheduledPost> {
  const params = new URLSearchParams();
  if (data.content_text) params.set('content_text', data.content_text);
  if (data.scheduled_for) params.set('scheduled_for', data.scheduled_for);
  if (data.platform) params.set('platform', data.platform);
  const qs = params.toString();
  const res = await apiFetch(`/publish/${postId}${qs ? `?${qs}` : ''}`, {
    method: 'PUT',
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not update post');
  }
  return (await res.json()) as ScheduledPost;
}

export async function publishNow(postId: string): Promise<{ post_id: string; status: string }> {
  const res = await apiFetch(`/publish/${postId}/publish-now`, { method: 'POST' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not publish now');
  }
  return (await res.json()) as { post_id: string; status: string };
}

export async function cancelPost(postId: string): Promise<void> {
  const res = await apiFetch(`/publish/${postId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw await getApiError(res, 'Could not cancel post');
  }
}