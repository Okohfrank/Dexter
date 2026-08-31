/**
 * Media library API wrappers backed by `backend/app/api/media.py`.
 * GET /media, POST /media, POST /media/generate-visual.
 * On any error we return empty / rethrow so screens can show honest empty states.
 */
import { apiFetch } from './client';
import type { MediaAsset, MediaType } from '../types';

export async function listMediaAssets(businessId?: string): Promise<MediaAsset[]> {
  try {
    const qs = businessId ? `?business_id=${businessId}` : '';
    const res = await apiFetch(`/media${qs}`, { method: 'GET' });
    if (res.ok) {
      const data = (await res.json()) as MediaAsset[];
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // Honest empty state
  }
  return [];
}

export async function uploadMediaAsset(data: {
  business_id?: string;
  file_name: string;
  media_type: MediaType;
  url: string;
  tags: string[];
}): Promise<MediaAsset> {
  const res = await apiFetch('/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  return (await res.json()) as MediaAsset;
}