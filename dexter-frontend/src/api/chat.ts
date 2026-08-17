/** Chat API wrappers (backend: /api/v1/chat/message). */
import { apiFetch, getApiError } from './client';
import type { ChatMessage, ChatResponse } from '../types';

export async function sendChatMessage(
  messages: ChatMessage[],
  opts?: { businessId?: string; connectedAccountId?: string; autoPublish?: boolean },
): Promise<ChatResponse> {
  const res = await apiFetch('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      business_id: opts?.businessId,
      connected_account_id: opts?.connectedAccountId,
      auto_publish: opts?.autoPublish ?? false,
    }),
  });
  if (!res.ok) {
    throw await getApiError(res, 'Could not reach Dexter');
  }
  return (await res.json()) as ChatResponse;
}