/** Media library API wrappers.
 *
 * No backend endpoint exists yet (PRD §4) — these return mock data so the
 * screen renders now; swap the bodies for live calls once the media endpoint
 * lands. The shapes conform to `MediaAsset`.
 */
import type { MediaAsset, MediaType } from '../types';

export async function listMediaAssets(businessId?: string): Promise<MediaAsset[]> {
  void businessId;
  return [
    {
      id: 'mock-media-1',
      business_id: 'mock',
      file_name: 'product-hero.png',
      media_type: 'image',
      url: 'https://picsum.photos/seed/product/400/400',
      tags: ['product', 'hero'],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'mock-media-2',
      business_id: 'mock',
      file_name: 'team-photo.jpg',
      media_type: 'image',
      url: 'https://picsum.photos/seed/team/400/400',
      tags: ['team', 'culture'],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
    {
      id: 'mock-media-3',
      business_id: 'mock',
      file_name: 'logo-dark.png',
      media_type: 'image',
      url: 'https://picsum.photos/seed/logo/400/400',
      tags: ['logo', 'brand'],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    },
  ];
}

export async function uploadMediaAsset(data: {
  business_id?: string;
  file_name: string;
  media_type: MediaType;
  url: string;
  tags: string[];
}): Promise<MediaAsset> {
  return {
    id: `media-${Date.now()}`,
    business_id: data.business_id ?? 'mock',
    file_name: data.file_name,
    media_type: data.media_type,
    url: data.url,
    tags: data.tags,
    created_at: new Date().toISOString(),
  };
}