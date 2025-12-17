import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { leadApi } from '../services/leadApi';
import { useAuthStore } from './authStore';

interface LeadState {
  // State
  leads: any[];
  currentLead: any | null;
  loading: boolean;
  error: string | null;
  pagination: any;
  loadingDetail: boolean,


  // Actions
  fetchLeads: (params?: any) => Promise<void>;
  fetchLeadById: (id: number) => Promise<void>;
  clearLeads: () => void;
  clearCurrentLead: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      // Initial state
      leads: [],
      currentLead: null,
      loading: false,
      loadingDetail: false,
      error: null,
      pagination: null,

      // Fetch all Leads
      fetchLeads: async (params: any = {}) => {
        set({ loading: true, error: null });
        try {
          // Check user role and add franchise_id for Technician role
          const user = useAuthStore.getState().user;
          if (user?.role === "Technician" && user.franchiseId) {
            params.franchise_id = user.franchiseId;
          }
          
          const response = await leadApi.getLeads(params);

          if (response.status) {
            set({
              leads: response.leads || [],
              pagination: response.pagination || null,
              loading: false,
              error: null,
            });
          } else {
            set({
              error: response.message || 'Failed to fetch leads',
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

      fetchLeadById: async (id: number) => {
        set({ loadingDetail: true, error: null });

        try {
          const response = await leadApi.getLeadById(id);

          set({
            currentLead: response || null,
            loadingDetail: false,
            error: null,
          });

          return response;

        } catch (error: any) {
          console.error("❌ Error fetching lead:", error);
          set({
            error: error.message || "Failed to fetch lead details",
            loadingDetail: false
          });
        }
      },


      // Clear lists
      clearLeads: () => {
        set({ leads: [], pagination: null, error: null });
      },

      // Clear single lead
      clearCurrentLead: () => {
        set({ currentLead: null });
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'lead-storage',

      // Persist list + pagination only
      partialize: (state) => ({
        leads: state.leads,
        pagination: state.pagination,
      }) as Partial<LeadState>,
    }
  )
);
