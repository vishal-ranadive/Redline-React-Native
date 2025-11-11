import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { leadApi } from '../services/leadApi';

interface LeadState {
  // State
  leads: any[];
  loading: boolean;
  error: string | null;
  pagination: any;
  
  // Actions
  fetchLeads: (page?: number, pageSize?: number) => Promise<void>;
  clearLeads: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      // Initial state
      leads: [],
      loading: false,
      error: null,
      pagination: null,

      // Actions
      fetchLeads: async (params: any = {}) => {
        set({ loading: true, error: null });
        
        try {
          const response = await leadApi.getLeads(params);
          
          console.log('📦 Lead API Response:', response);
          
          if (response.status) {
            set({ 
              leads: response.leads || [],
              pagination: response.pagination || null,
              loading: false,
              error: null
            });
          } else {
            const errorMessage = response.message || 'Failed to fetch leads';
            set({ 
              error: errorMessage,
              loading: false 
            });
          }
        } catch (error: any) {
          console.error('❌ Lead Store Error:', error);
          
          let errorMessage = 'Network error';
          
          if (error.response) {
            errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
          } else if (error.request) {
            errorMessage = 'No response from server';
          } else {
            errorMessage = error.message || 'Unknown error occurred';
          }
          
          set({ 
            error: errorMessage,
            loading: false 
          });
        }
      },

      clearLeads: () => {
        set({ 
          leads: [], 
          pagination: null, 
          error: null 
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'lead-storage',
      partialize: (state) => ({ 
        leads: state.leads,
        pagination: state.pagination 
      }),
    }
  )
);