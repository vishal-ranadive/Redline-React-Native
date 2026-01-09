// src/store/gearStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gearApi } from '../services/gearApi';
import { gearFindingsApi } from '../services/gearFindingsApi';

export interface GearType {
  gear_type_id: number;
  gear_type: string;
  is_harness: boolean;
  is_hydrotest: boolean;
}

export interface Gear {
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
    city: string; 
    country: string;
    state: string; 
    address: string;
    phone: string;
    email: string;
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
  remarks?:string;
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

export interface GearFinding {
  id: number;
  findings: string;
}

export interface GearHistoryItem {
  repair_id: number;
  lead: {
    lead_id: number;
    franchise: {
      franchise_id: number;
      corporate: {
        corporate_id: number;
        corporate_name: string;
      };
      franchise_name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      zip_code: string;
      state: string;
      country: string;
      latitude: string;
      longitude: string;
      active_status: boolean;
      is_deleted: boolean;
      created_at: string;
      updated_at: string;
      created_by: string;
      updated_by: string;
    };
    firestation: {
      firestation_id: number;
      fire_station_name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      zip_code: string;
      state: string;
      country: string;
      latitude: string;
      longitude: string;
      active_status: boolean;
      is_deleted: boolean;
      created_at: string;
      updated_at: string;
      created_by: string;
      updated_by: string;
      franchise: {
        id: number;
        name: string;
        city: string;
        state: string;
        country: string;
        zip_code: string;
      };
    };
    assigned_technicians: Array<{
      id: number;
      name: string;
    }>;
    type: string;
    schedule_date: string;
    lead_status: string;
    repair_cost: number;
    remarks: string;
    water_hardness: null;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  };
  firestation: {
    firestation_id: number;
    fire_station_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip_code: string;
    state: string;
    country: string;
    latitude: string;
    longitude: string;
    active_status: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    franchise: {
      id: number;
      name: string;
      city: string;
      state: string;
      country: string;
      zip_code: string;
    };
  };
  gear: {
    gear_id: number;
    roster: {
      roster_id: number;
      first_name: string;
      middle_name: string;
      last_name: string;
      email: string;
      phone: string;
      rank: string;
    };
    gear_name: string;
    manufacturer: {
      manufacturer_id: number;
      manufacturer_name: string;
    };
    franchise: {
      id: number;
      name: string;
      city: string;
      state: string;
      country: string;
      zip_code: string;
    };
    firestation: {
      id: number;
      name: string;
      address: string;
    };
    gear_type: {
      gear_type_id: number;
      gear_type: string;
      is_harness: boolean;
      is_hydrotest: boolean;
    };
    manufacturing_date: string;
    gear_size: null | string;
    active_status: boolean;
    is_deleted: boolean;
    serial_number: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  };
  roster: {
    roster_id: number;
    franchise: {
      id: number;
      name: string;
      city: string;
      state: string;
      country: string;
      zip_code: string;
    };
    firestation: {
      id: number;
      name: string;
      address: string;
    };
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
    rank: string;
    active_status: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    roster_name: string;
    tag_color: null | string;
  };
  repair_status: string;
  repair_subtotal_cost: number;
  repair_quantity: number;
  repair_cost: number;
  spare_gear: boolean;
  remarks: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  record_type: string;
  repair_images?: Array<string>; // Array of image URLs for repairs
  inspection_images?: Array<string>; // Array of image URLs for inspections
  inspection_id?: number; // For inspection records
}

interface GearState {
  // State
  gearTypes: GearType[];
  gears: Gear[];
  currentGear: Gear | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
  } | null;

  gearFindings: GearFinding[];
  gearFindingsLoading: boolean;

    gearStatus: [];             
    gearStatusLoading: boolean;

    gearHistory: GearHistoryItem[];
    gearHistoryLoading: boolean;
    gearHistoryPagination: {
      page: number;
      page_size: number;
      total: number;
    } | null;   

  


  // Actions
  fetchGearTypes: () => Promise<void>;
  fetchGearStatus: ()=> Promise<void>;
  fetchGearFindings: (gearTypeId: number) => Promise<void>;
  fetchGearHistory: (gearId: number, params?: any) => Promise<void>;
  createGear: (gearData: any) => Promise<Gear | null>;
  updateGear: (id: number, gearData: any) => Promise<Gear | null>;
  fetchGearById: (id: number) => Promise<Gear | null>;
  searchGears: (params?: any) => Promise<{success: boolean, message?: string}>;
  ScanGearsWithBarcode: (params?: any) => Promise<void>;
  scanGear: (firestationId: number, serialNumber: string, leadId: number, lead_type: string) => Promise<any>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearCurrentGear: () => void;
  clearGears: () => void;
  clearGearHistory: () => void;
}



export const useGearStore = create<GearState>()(
  persist(
    (set, get) => ({
      // Initial state
      gearTypes: [],
      gears: [],
      currentGear: null,
      loading: false,
      error: null,
      pagination: null,
      gearFindings:[],
      gearFindingsLoading: false, 

      gearStatus: [],
      gearStatusLoading: false,

      gearHistory: [],
      gearHistoryLoading: false,
      gearHistoryPagination: null,


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

      // Create new gear
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

      // Update gear
      updateGear: async (id: number, gearData: any) => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.updateGear(id, gearData);
          if (response.status) {
            const updatedGear = response.gear;
            set({ 
              loading: false, 
              error: null,
              currentGear: updatedGear 
            });
            return updatedGear;
          } else {
            set({
              error: response.message || 'Failed to update gear',
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

      // Search gears by serial number - UPDATED to handle 404 properly
      searchGears: async (params: any = {}) => {
        set({ loading: true, error: null, gears: [] });
        try {
          const response = await gearApi.getGears(params);
          if (response.status) {
            set({
              gears: response.gears || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              gears: [],
              error: response.message || 'No gears found',
              loading: false,
            });
            return { success: false, message: response.message };
          }
        } catch (error: any) {
          // Handle 404 specifically
          if (error.response?.status === 404) {
            set({
              gears: [],
              error: error.response?.data?.message || 'No gears found',
              loading: false,
            });
            return { success: false, message: error.response?.data?.message || 'No gears found' };
          } else {
            set({
              gears: [],
              error: error.message || 'Network error',
              loading: false,
            });
            return { success: false, message: error.message || 'Network error' };
          }
        }
      },

      // Scan gears with barcode
      ScanGearsWithBarcode: async (params: any = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.getGears(params);
          if (response.status) {
            set({
              gears: response.gears || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to search gears',
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

      // Scan gear by serial number
      scanGear: async (firestationId: number, serialNumber: string, leadId: number, lead_type: string) => {
        set({ loading: true, error: null });
        try {
          const response = await gearApi.scanGear(firestationId, serialNumber, leadId, lead_type);
          set({ loading: false, error: null });
          return response;
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            loading: false,
          });
          throw error;
        }
      },


      fetchGearFindings: async (gearTypeId: number) => {
        set({ gearFindingsLoading: true, error: null });
        try {
          const response = await gearFindingsApi.getGearFindings(gearTypeId);
          if (response.status) {
            set({
              gearFindings: response.gear_findings || [],
              gearFindingsLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch gear findings',
              gearFindingsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            gearFindingsLoading: false,
          });
        }
      },

            // --- FETCH GEAR STATUS (NEW) ---
      fetchGearStatus: async () => {
        set({ gearStatusLoading: true, error: null });

        try {
          const response = await gearApi.getGearStatus();
          if (response.status) {
            set({
              gearStatus: response.data || [],
              gearStatusLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || "Failed to fetch gear status",
              gearStatusLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || "Network error",
            gearStatusLoading: false,
          });
        }
      },

      // Fetch gear history
      fetchGearHistory: async (gearId: number, params?: any) => {
        set({ gearHistoryLoading: true, error: null });
        try {
          const response = await gearApi.getGearHistory(gearId, params);
          if (response.status) {
            set({
              gearHistory: response.list || [],
              gearHistoryPagination: response.pagination || null,
              gearHistoryLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch gear history',
              gearHistoryLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            gearHistoryLoading: false,
          });
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      clearCurrentGear: () => set({ currentGear: null }),
      clearGears: () => set({ gears: [], pagination: null }),
      clearGearHistory: () => set({ gearHistory: [], gearHistoryPagination: null }),
    }),
    {
      name: 'gear-storage',
      partialize: (state) => ({
        gearTypes: state.gearTypes,
      }) as Partial<GearState>,
    }
  )
);