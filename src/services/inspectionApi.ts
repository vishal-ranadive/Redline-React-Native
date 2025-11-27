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

export const inspectionApiViewFirefighter = {
  // Get firefighter inspection information
  getFirefighterInspectionView: async (
    leadId: number,
    inspectionId: number,
  ): Promise<any> => {
    const params = {
      leadId: leadId,
      inspectionId: inspectionId,
    };

    console.log(`➡️ API CALL /gear-inspections/firefighter-view/`, params);
    const response = await axiosInstance.get(`/gear-inspections/firefighter-view/`, {
      params,
    });
    console.log(`✅ API Response /gear-inspections/firefighter-view/`, response.data);
    return response.data;
  },
};