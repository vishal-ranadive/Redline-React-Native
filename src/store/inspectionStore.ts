// src/store/inspectionStore.ts
import { create } from 'zustand';
import { inspectionApi } from '../services/inspectionApi';

interface GearInspection {
  gear_id: number;
  gear_type_id: number;
  gear_usage: any;
  gear_name: string;
  current_inspection: any | null;
  previous_inspection: any | null;
}

interface InspectionState {
  // State
  firefighterGears: GearInspection[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFirefighterGears: (leadId: number, rosterId: number) => Promise<void>;
  clearFirefighterGears: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  // Initial state
  firefighterGears: [],
  loading: false,
  error: null,

  // Fetch firefighter gears
  fetchFirefighterGears: async (leadId: number, rosterId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await inspectionApi.getFirefighterInspectionInfo(leadId, rosterId);
      
      if (response.status) {
        set({
          firefighterGears: response.gear || [],
          loading: false,
          error: null,
        });
      } else {
        set({
          error: response.message || 'Failed to fetch firefighter gears',
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Network error',
        loading: false,
      });
    }
  },

  // Clear firefighter gears
  clearFirefighterGears: () => {
    set({ firefighterGears: [], error: null });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));