import { axiosInstance } from './api';

export const rosterApi = {
  // Get all rosters with optional search parameters
  getRosters: async (params?: any): Promise<any> => {
    console.log('➡️ API CALL /roster/ with', params);
    const response = await axiosInstance.get(`/roster/`, { params });
    console.log('✅ API Response /roster/ with', response.data);
    return response.data;
  },

  getRostersByFirestation: async (firestationId: number, params?: any): Promise<any> => {
    console.log('➡️ API CALL /roster/firestation/', firestationId, 'with', params);
    console.log('Endpoint', `/roster/firestation/${firestationId}/${params.firestation_id}`)
    const response = await axiosInstance.get(`/roster/firestation/${firestationId}/`);
    console.log('✅ API Response /roster/firestation/', response.data);
    return response.data;
  },

  // Get roster by ID
  getRosterById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/roster/${id}/`);
    return response.data;
  },

  // Create new roster
  createRoster: async (rosterData: any): Promise<any> => {
    const response = await axiosInstance.post(`/roster/`, rosterData);
    return response.data;
  },

  // Update roster
  updateRoster: async (id: number, rosterData: any): Promise<any> => {
    const response = await axiosInstance.put(`/roster/${id}/`, rosterData);
    return response.data;
  },

  // Delete roster (soft delete)
  deleteRoster: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(`/roster/${id}/`);
    return response.data;
  },
};