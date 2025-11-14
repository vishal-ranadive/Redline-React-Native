import { axiosInstance } from './api';

export const manufacturerApi = {
  // Get all manufacturers with optional search parameters
  getManufacturers: async (params?: any): Promise<any> => {
    console.log('➡️ API CALL /manufacturer/ with', params);
    const response = await axiosInstance.get(`/manufacturer/`, { params });
    console.log('✅ API Response /manufacturer/ with', response.data);
    return response.data;
  },

  // Get manufacturer by ID
  getManufacturerById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/manufacturer/${id}/`);
    return response.data;
  },

  // Create new manufacturer
  createManufacturer: async (manufacturerData: any): Promise<any> => {
    const response = await axiosInstance.post(`/manufacturer/`, manufacturerData);
    return response.data;
  },

  // Update manufacturer
  updateManufacturer: async (id: number, manufacturerData: any): Promise<any> => {
    const response = await axiosInstance.put(`/manufacturer/${id}/`, manufacturerData);
    return response.data;
  },
};