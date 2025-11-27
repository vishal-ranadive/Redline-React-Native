// src/services/inspectionApi.ts
import { axiosInstance } from './api';

export const inspectionApi = {
  // Get firefighter inspection information
  getFirefighterInspectionInfo: async (leadId: number, rosterId: number): Promise<any> => {
    console.log(`➡️ API CALL /firefighter-inspection-information/?lead_id=${leadId}&roster_id=${rosterId}`);
    const response = await axiosInstance.get(`/firefighter-inspection-information/`, {
      params: {
        lead_id: leadId,
        roster_id: rosterId
      }
    });
    console.log(`✅ API Response /firefighter-inspection-information/`, response.data);
    return response.data;
  },
};

