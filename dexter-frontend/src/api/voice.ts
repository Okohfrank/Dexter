/**
 * Voice API service for real-time speech transcription & MisoLabs.ai agent integration.
 */
import { apiFetch } from './client';
import { API_BASE_URL } from '../config';

export type TranscriptionResult = {
  transcript: string;
  is_final: boolean;
  distilled_brain?: Record<string, any>;
};

export type VoiceStreamCallbacks = {
  onAssistantReply?: (text: string, state: 'listening' | 'processing' | 'speaking') => void;
  onBrainDistilled?: (brain: Record<string, any>) => void;
  onError?: (err: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function connectVoiceStream(callbacks: VoiceStreamCallbacks) {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/voice/stream';
  let ws: WebSocket | null = null;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      callbacks.onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'assistant_reply') {
          callbacks.onAssistantReply?.(msg.text, msg.state || 'speaking');
        } else if (msg.type === 'state') {
          callbacks.onAssistantReply?.('', msg.status);
        } else if (msg.type === 'distilled_brain') {
          callbacks.onBrainDistilled?.(msg.brain);
        }
      } catch (e) {
        // Non-JSON frame
      }
    };

    ws.onerror = (err) => {
      callbacks.onError?.(err);
    };

    ws.onclose = () => {
      callbacks.onClose?.();
    };
  } catch (e) {
    callbacks.onError?.(e);
  }

  return {
    sendSpeechText: (text: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'user_speech', text }));
      }
    },
    sendFinish: () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'finish' }));
      }
    },
    close: () => {
      if (ws) {
        ws.close();
      }
    },
  };
}

export async function transcribeAudio(audioUri: string, businessId?: string): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'interview_audio.m4a',
    type: 'audio/m4a',
  } as any);
  if (businessId) {
    formData.append('business_id', businessId);
  }

  const res = await apiFetch('/voice/transcribe', {
    method: 'POST',
    body: formData as any,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Server error');
    throw new Error(`Speech transcription failed (${res.status}): ${errorText}`);
  }

  return (await res.json()) as TranscriptionResult;
}
