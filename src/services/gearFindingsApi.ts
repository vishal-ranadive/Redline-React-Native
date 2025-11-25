// src/services/gearFindingsApi.ts
import { axiosInstance } from './api';

export const gearFindingsApi = {
  // Get gear findings by gear type ID
  getGearFindings: async (gearTypeId: number): Promise<any> => {
    console.log(`➡️ API CALL /gear-findings/${gearTypeId}/`);
    const response = await axiosInstance.get(`/gear-findings/${gearTypeId}/`);
    console.log(`✅ API Response /gear-findings/${gearTypeId}/`, response.data);
    return response.data;
  },
};