// src/services/inspectionApi.ts
import { axiosInstance } from './api';

export const inspectionApi = {



      // Create gear inspection
    createGearInspection: async (payload: any): Promise<any> => {
      console.log("➡️ API CALL POST /gear-inspections/", payload);

      const response = await axiosInstance.post(`/gear-inspections/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ API Response POST /gear-inspections/", response.data);
      return response.data;
    },


    // Update gear inspection
    updateGearInspection: async (inspectionId: number, payload: any): Promise<any> => {
      console.log(`➡️ API CALL PUT /gear-inspections/${inspectionId}/`, payload);

      const response = await axiosInstance.put(`/gear-inspections/${inspectionId}/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log(`✅ API Response PUT /gear-inspections/${inspectionId}/`, response.data);
      return response.data;
    },
    // Update gear inspection
    getGearInspectionByInspectionId: async (inspectionId: number): Promise<any> => {
      console.log(`➡️ API CALL GET /gear-inspections/${inspectionId}/`);

      const response = await axiosInstance.get(`/gear-inspections/${inspectionId}/`, {
        headers: { "Content-Type": "application/json" },
      });

      console.log(`✅ API Response GET /gear-inspections/${inspectionId}/`, response.data);
      return response.data;
    },

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