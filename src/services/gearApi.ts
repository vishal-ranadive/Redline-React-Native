import { axiosInstance } from './api';

export const gearApi = {
  // Get all gear types
  getGearTypes: async (): Promise<any> => {
    console.log('➡️ API CALL /gear-types/');
    const response = await axiosInstance.get(`/gear-types/`);
    console.log('✅ API Response /gear-types/', response.data);
    return response.data;
  },

  getGearStatus: async (): Promise<any> => {
  console.log("➡️ API CALL /gear-status/");
  const response = await axiosInstance.get(`/gear-status/`);
  console.log("✅ API Response /gear-status/", response.data);
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
    console.log('➡️ API CALL /gear/${id}/');
    const response = await axiosInstance.get(`/gear/${id}/`);
    console.log('✅ API Response /gear/${id}/', response.data);
    return response.data;
  },

  // Search gears with optional parameters (gear_name)
  getGears: async (params?: any): Promise<any> => {
    console.log('➡️ API CALL /gear/ with params:', params);
    try {
      const response = await axiosInstance.get(`/gear/`, { params });
      console.log('✅ API Response /gear/:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Gears found:', response.data.gears?.length || 0);
      return response.data;
    } catch (error: any) {
      console.log('❌ API Error /gear/:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Update gear
  updateGear: async (id: number, gearData: any): Promise<any> => {
    console.log(`➡️ API CALL PUT /gear/${id}/ with`, gearData);
    const response = await axiosInstance.put(`/gear/${id}/`, gearData);
    console.log(`✅ API Response PUT /gear/${id}/`, response.data);
    return response.data;
  },

  // Delete gear
  deleteGear: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(`/gear/${id}/`);
    return response.data;
  },

  // Scan gear by serial number
  scanGear: async (firestationId: number, serialNumber: string, leadId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /scan-gear/${firestationId}/${serialNumber}/?leadId=${leadId}`);
    try {
      const response = await axiosInstance.get(`/scan-gear/${firestationId}/${serialNumber}/`, {
        params: { leadId }
      });
      console.log(`✅ API Response /scan-gear/${firestationId}/${serialNumber}/`, response.data);
      return response.data;
    } catch (error: any) {
      console.log('❌ API Error /scan-gear/:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Get gear history by gear ID
  getGearHistory: async (gearId: number, params?: any): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-history/${gearId}/`);
    try {
      const response = await axiosInstance.get(`/gear-history/${gearId}/`, { params });
      console.log(`✅ API Response /gear-history/${gearId}/`, response.data);
      return response.data;
    } catch (error: any) {
      console.log('❌ API Error /gear-history/:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error response:', error.response?.data);
      throw error;
    }
  },
};