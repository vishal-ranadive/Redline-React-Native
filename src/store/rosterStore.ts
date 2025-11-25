import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rosterApi } from '../services/rosterApi';

interface Roster {
  roster_id: number;
  franchise: {
    id: number;
    name: string;
  };
  firestation: {
    id: number;
    name: string;
  };
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  active_status: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  roster_name: string;
}

interface RosterState {
  // State
  rosters: Roster[];
  currentRoster: Roster | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
  } | null;

  // Actions
  fetchRosters: (params?: any) => Promise<void>;
  fetchRosterById: (id: number) => Promise<void>;
  createRoster: (rosterData: any) => Promise<boolean>;
  clearRosters: () => void;
  clearCurrentRoster: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // roster
    fetchRostersByFirestation: (firestationId: number, params?: any) => Promise<void>;

}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      // Initial state
      rosters: [],
      currentRoster: null,
      loading: false,
      error: null,
      pagination: null,

      // Fetch all Rosters
      fetchRosters: async (params: any = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await rosterApi.getRosters(params);

          if (response.status) {
            set({
              rosters: response.rosters || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch rosters',
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

      // Fetch single roster by ID
      fetchRosterById: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await rosterApi.getRosterById(id);
          set({
            currentRoster: response || null,
            loading: false,
            error: null,
          });
          return response;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch roster',
            loading: false,
          });
          return null;
        }
      },

      // Create new roster
      createRoster: async (rosterData: any) => {
        set({ loading: true, error: null });
        try {
          const response = await rosterApi.createRoster(rosterData);
          if (response.status) {
            set({ loading: false, error: null });
            return true;
          } else {
            set({
              error: response.message || 'Failed to create roster',
              loading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: error.message || 'Network error',
            loading: false,
          });
          return false;
        }
      },
      // Add to your store implementation
      fetchRostersByFirestation: async (firestationId: number, params: any = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await rosterApi.getRostersByFirestation(firestationId, params);

          if (response.status) {
            set({
              rosters: response.rosters || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch rosters',
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

      // Clear lists
      clearRosters: () => {
        set({ rosters: [], pagination: null, error: null });
      },

      // Clear single roster
      clearCurrentRoster: () => {
        set({ currentRoster: null });
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'roster-storage',
      partialize: (state) => ({
        rosters: state.rosters,
        pagination: state.pagination,
      }) as Partial<RosterState>,
    }
  )
);