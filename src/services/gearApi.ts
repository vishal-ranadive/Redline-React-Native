import { axiosInstance } from './api';

export const gearApi = {
  // Get all gear types
  getGearTypes: async (): Promise<any> => {
    console.log('➡️ API CALL /gear-types/');
    const response = await axiosInstance.get(`/gear-types/`);
    console.log('✅ API Response /gear-types/', response.data);
    return response.data;
  },

  // Create new gear
  createGear: async (gearData: any): Promise<any> => {
    console.log('➡️ API CALL /gear/ with', gearData);
    const response = await axiosInstance.post(`/gear/`, gearData);
    console.log('✅ API Response /gear/', response.data);
    return response.data;
  },

  // Get gear by ID
  getGearById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/gear/${id}/`);
    return response.data;
  },

  // Update gear
  updateGear: async (id: number, gearData: any): Promise<any> => {
    const response = await axiosInstance.put(`/gear/${id}/`, gearData);
    return response.data;
  },

  // Delete gear
  deleteGear: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(`/gear/${id}/`);
    return response.data;
  },
};