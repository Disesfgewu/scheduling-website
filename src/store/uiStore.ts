import { create } from 'zustand';

export type TripDetailTab = 'timeline' | 'candidates' | 'map' | 'members';

interface UIState {
  isAddCandidateOpen: boolean;
  schedulingCandidateId: string | null;
  activeTripTab: TripDetailTab;
  mapCenter: [number, number] | null;

  openAddCandidate: () => void;
  closeAddCandidate: () => void;
  openScheduleModal: (candidateId: string) => void;
  closeScheduleModal: () => void;
  setActiveTripTab: (tab: TripDetailTab) => void;
  setMapCenter: (center: [number, number] | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddCandidateOpen: false,
  schedulingCandidateId: null,
  activeTripTab: 'timeline',
  mapCenter: null,

  openAddCandidate: () => set({ isAddCandidateOpen: true }),
  closeAddCandidate: () => set({ isAddCandidateOpen: false }),
  openScheduleModal: (candidateId) => set({ schedulingCandidateId: candidateId }),
  closeScheduleModal: () => set({ schedulingCandidateId: null }),
  setActiveTripTab: (tab) => set({ activeTripTab: tab }),
  setMapCenter: (center) => set({ mapCenter: center }),
}));
