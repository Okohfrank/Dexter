/** App state: current business, onboarding progress, and connection status. */
import { create } from 'zustand';
import type {
  Business,
  ConnectedAccount,
  BusinessBrain,
  ContentPlan,
} from '../types';

type InterviewMode = 'text' | 'voice';

type AppState = {
  business: Business | null;
  connectedAccounts: ConnectedAccount[];
  brain: BusinessBrain | null;
  contentPlan: ContentPlan | null;
  interviewMode: InterviewMode | null;
  autonomousMode: boolean;
  setBusiness: (business: Business | null) => void;
  setConnectedAccounts: (accounts: ConnectedAccount[]) => void;
  setBrain: (brain: BusinessBrain) => void;
  setContentPlan: (plan: ContentPlan) => void;
  setInterviewMode: (mode: InterviewMode) => void;
  setAutonomousMode: (on: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  business: null,
  connectedAccounts: [],
  brain: null,
  contentPlan: null,
  interviewMode: null,
  autonomousMode: false,
  setBusiness: (business) => set({ business }),
  setConnectedAccounts: (connectedAccounts) => set({ connectedAccounts }),
  setBrain: (brain) => set({ brain }),
  setContentPlan: (contentPlan) => set({ contentPlan }),
  setInterviewMode: (interviewMode) => set({ interviewMode }),
  setAutonomousMode: (autonomousMode) => set({ autonomousMode }),
  reset: () =>
    set({
      business: null,
      connectedAccounts: [],
      brain: null,
      contentPlan: null,
      interviewMode: null,
      autonomousMode: false,
    }),
}));