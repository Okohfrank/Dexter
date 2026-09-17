/** Local copilot conversation sessions (zustand, in-memory).
 *
 * The backend exposes only POST /chat/message — no history endpoint —
 * so previous chats persist here for the app lifetime. A backend
 * history route is the proper long-term fix; this store mirrors its
 * future shape (id/title/messages/brief/updatedAt) for an easy swap.
 */
import { create } from 'zustand';
import type { ChatMessage, ChatBrief } from '../types';

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  brief: ChatBrief | null;
  updatedAt: number;
};

type ChatStore = {
  sessions: ChatSession[];
  upsertSession: (s: ChatSession) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  upsertSession: (s) =>
    set((state) => ({
      sessions: [
        s,
        ...state.sessions.filter((prev) => prev.id !== s.id),
      ].slice(0, 30),
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    })),
  clearSessions: () => set({ sessions: [] }),
}));

export function sessionTitleFrom(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const text = (firstUser?.content ?? 'New conversation').trim();
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}
