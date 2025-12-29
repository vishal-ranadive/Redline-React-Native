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
  pagination: {
    page: number;
    page_size: number;
    total: number;
  } | null;

  // Actions
  fetchFirefighterRepairGears: (leadId: number, rosterId: number, page?: number, pageSize?: number) => Promise<void>;
  clearFirefighterRepairGears: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRepairStore = create<RepairState>((set, get) => ({
  // Initial state
  firefighterRepairGears: [],
  loading: false,
  error: null,
  pagination: null,

  // Fetch firefighter repair gears
  fetchFirefighterRepairGears: async (leadId: number, rosterId: number, page?: number, pageSize?: number) => {
    set({ loading: true, error: null });
    try {
      const params = {
        lead_id: leadId,
        roster_id: rosterId,
        ...(page && { page }),
        ...(pageSize && { page_size: pageSize }),
      };

      const response = await repairApi.getFirefighterRepairInformationWithPagination(params);

      if (response.status) {
        set({
          firefighterRepairGears: response.gear || [],
          pagination: response.pagination || null,
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
    set({ firefighterRepairGears: [], pagination: null, error: null });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
