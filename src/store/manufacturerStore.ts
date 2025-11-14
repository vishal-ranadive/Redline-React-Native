import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { manufacturerApi } from '../services/manufacturerApi';

interface Manufacturer {
  manufacturer_id: number;
  manufacturer_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  state?: string;
  country?: string;
  active_status?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

interface ManufacturerState {
  // State
  manufacturers: Manufacturer[];
  currentManufacturer: Manufacturer | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
  } | null;

  // Actions
  fetchManufacturers: (params?: any) => Promise<void>;
  fetchManufacturerById: (id: number) => Promise<void>;
  clearManufacturers: () => void;
  clearCurrentManufacturer: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useManufacturerStore = create<ManufacturerState>()(
  persist(
    (set, get) => ({
      // Initial state
      manufacturers: [],
      currentManufacturer: null,
      loading: false,
      error: null,
      pagination: null,

      // Fetch all Manufacturers
      fetchManufacturers: async (params: any = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await manufacturerApi.getManufacturers(params);

          if (response.status) {
            set({
              manufacturers: response.manufacturers || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch manufacturers',
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

      // Fetch single manufacturer by ID
      fetchManufacturerById: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await manufacturerApi.getManufacturerById(id);
          set({
            currentManufacturer: response || null,
            loading: false,
            error: null,
          });
          return response;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch manufacturer',
            loading: false,
          });
          return null;
        }
      },

      // Clear lists
      clearManufacturers: () => {
        set({ manufacturers: [], pagination: null, error: null });
      },

      // Clear single manufacturer
      clearCurrentManufacturer: () => {
        set({ currentManufacturer: null });
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'manufacturer-storage',
      partialize: (state) => ({
        manufacturers: state.manufacturers,
        pagination: state.pagination,
      }) as Partial<ManufacturerState>,
    }
  )
);