// src/store/repairStore.ts
import { create } from 'zustand';
import { repairApi } from '../services/repairApi';

interface GearRepair {
  gear: {
    gear_id: number;
    gear_name: string;
    gear_type: {
      gear_type_id: number;
      gear_type: string;
    };
    serial_number?: string;
    manufacturer?: {
      manufacturer_id: number;
      manufacturer_name: string;
    };
    gear_size?: string;
    [key: string]: any;
  };
  gear_usage?: any;
  current_repair: any | null;
  previous_repair: any | null;
}

interface RepairState {
  // State
  firefighterRepairGears: GearRepair[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFirefighterRepairGears: (leadId: number, rosterId: number) => Promise<void>;
  clearFirefighterRepairGears: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRepairStore = create<RepairState>((set, get) => ({
  // Initial state
  firefighterRepairGears: [],
  loading: false,
  error: null,

  // Fetch firefighter repair gears
  fetchFirefighterRepairGears: async (leadId: number, rosterId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await repairApi.getFirefighterRepairInformation(leadId, rosterId);

      if (response.status) {
        set({
          firefighterRepairGears: response.gear || [],
          loading: false,
          error: null,
        });
      } else {
        set({
          error: response.message || 'Failed to fetch firefighter repair gears',
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

  // Clear firefighter repair gears
  clearFirefighterRepairGears: () => {
    set({ firefighterRepairGears: [], error: null });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
