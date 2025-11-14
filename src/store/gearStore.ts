import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gearApi } from '../services/gearApi';

interface GearType {
  gear_type_id: number;
  gear_type: string;
}

interface Gear {
  gear_id: number;
  roster: {
    roster_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  gear_name: string;
  manufacturer: {
    manufacturer_id: number;
    manufacturer_name: string;
    city:string; 
    country:string;
    state:string; 
    address:string;
    phone:string;
    email:string;
  };
  franchise: {
    id: number;
    name: string;
  };
  firestation: {
    id: number;
    name: string;
  };
  gear_type: {
    gear_type_id: number;
    gear_type: string;
  };
  manufacturing_date: string;
  gear_size: string | null;
  active_status: boolean;
  is_deleted: boolean;
  gear_image_url: string | null;
  serial_number: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface GearState {
  // State
  gearTypes: GearType[];
  currentGear: Gear | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchGearTypes: () => Promise<void>;
  createGear: (gearData: any) => Promise<Gear | null>;
  fetchGearById: (id: number) => Promise<Gear | null>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearCurrentGear: () => void;
}

export const useGearStore = create<GearState>()(
  persist(
    (set, get) => ({
      // Initial state
      gearTypes: [],
      currentGear: null,
      loading: false,
      error: null,

      // Fetch gear types
      fetchGearTypes: async () => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.getGearTypes();

          if (response.status) {
            set({
              gearTypes: response.gear_types || [],
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch gear types',
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

      // Create new gear - now returns the created gear
      createGear: async (gearData: any) => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.createGear(gearData);
          if (response.status) {
            const createdGear = response.gear;
            set({ 
              loading: false, 
              error: null,
              currentGear: createdGear 
            });
            return createdGear;
          } else {
            set({
              error: response.message || 'Failed to create gear',
              loading: false,
            });
            return null;
          }
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            loading: false,
          });
          return null;
        }
      },

      // Fetch gear by ID
      fetchGearById: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.getGearById(id);
          if (response.status) {
            const gear = response.gear;
            set({
              currentGear: gear,
              loading: false,
              error: null,
            });
            return gear;
          } else {
            set({
              error: response.message || 'Failed to fetch gear',
              loading: false,
            });
            return null;
          }
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            loading: false,
          });
          return null;
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      clearCurrentGear: () => set({ currentGear: null }),
    }),
    {
      name: 'gear-storage',
      partialize: (state) => ({
        gearTypes: state.gearTypes,
      }) as Partial<GearState>,
    }
  )
);