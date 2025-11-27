// src/store/inspectionStore.ts
import { create } from 'zustand';
import { inspectionApi, inspectionApiViewFirefighter } from '../services/inspectionApi';

export type FirefighterGearSummary = {
  id: number;
  gear_name: string;
  tag_color?: string | null;
  type?: {
    id: number;
    name: string;
  };
};

export type FirefighterRoster = {
  id: number;
  name: string;
  email: string;
  total_scan_count?: number;
  gear?: FirefighterGearSummary[];
};

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
  firefighterInspectionView: FirefighterRoster[];
  firefighterInspectionViewLoading: boolean;
  firefighterInspectionViewError: string | null;

  // Actions
  fetchFirefighterGears: (leadId: number, rosterId: number) => Promise<void>;
  fetchFirefighterInspectionView: (leadId: number, inspectionId: number) => Promise<void>;
  clearFirefighterGears: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  // Initial state
  firefighterGears: [],
  loading: false,
  error: null,
  firefighterInspectionView: [],
  firefighterInspectionViewLoading: false,
  firefighterInspectionViewError: null,
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

  // Fetch firefighter inspection view
  fetchFirefighterInspectionView: async (leadId: number, inspectionId: number) => {
    set({ firefighterInspectionViewLoading: true, firefighterInspectionViewError: null });
    try {
      const response = await inspectionApiViewFirefighter.getFirefighterInspectionView(leadId, inspectionId);
      const rosters = Array.isArray(response?.roster) ? (response.roster as FirefighterRoster[]) : [];
      if (response?.status && rosters.length > 0) {
        set({
          firefighterInspectionView: rosters,
          firefighterInspectionViewLoading: false,
          firefighterInspectionViewError: null,
        });
        return;
      }

      set({
        firefighterInspectionView: rosters,
        firefighterInspectionViewLoading: false,
        firefighterInspectionViewError:
          rosters.length === 0 ? 'No roster available' : response?.message || 'Failed to fetch firefighter inspection view',
      });
    } catch (error: any) {
      set({
        firefighterInspectionViewError: error.message || 'Network error',
        firefighterInspectionViewLoading: false,
        firefighterInspectionView: [],
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