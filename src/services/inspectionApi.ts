// src/services/inspectionApi.ts
import { axiosInstance } from './api';

export const inspectionApi = {
  // Create gear inspection
  createGearInspection: async (payload: any): Promise<any> => {
    console.log('➡️ API CALL POST /gear-inspections/', payload);

    const response = await axiosInstance.post(`/gear-inspections/`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ API Response POST /gear-inspections/', response.data);
    return response.data;
  },

  // Update gear inspection
  updateGearInspection: async (inspectionId: number, payload: any): Promise<any> => {
    console.log(`➡️ API CALL PUT /gear-inspections/${inspectionId}/`, payload);

    const response = await axiosInstance.put(`/gear-inspections/${inspectionId}/`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`✅ API Response PUT /gear-inspections/${inspectionId}/`, response.data);
    return response.data;
  },

  // Get single gear inspection by inspectionId
  getGearInspectionByInspectionId: async (inspectionId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-inspections/${inspectionId}/`);

    const response = await axiosInstance.get(`/gear-inspections/${inspectionId}/`, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`✅ API Response GET /gear-inspections/${inspectionId}/`, response.data);
    return response.data;
  },

  // Get gear inspections by loadId and leadId
  getGearInspections: async (loadId: number, leadId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-inspections/?load_id=${loadId}&lead_id=${leadId}`);

    const response = await axiosInstance.get(`/gear-inspections/`, {
      params: {
        load_id: loadId,
        lead_id: leadId,
      },
    });

    console.log('✅ API Response GET /gear-inspections/', response.data);
    return response.data;
  },

  // Get gear inspections loadwise by loadId and leadId
  getGearInspectionsLoadwise: async (loadId: number, leadId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-inspections/loadwise/?leadId=${leadId}&loadId=${loadId}`);

    const response = await axiosInstance.get(`/gear-inspections/loadwise/`, {
      params: {
        leadId: leadId,
        loadId: loadId,
      },
    });

    console.log('✅ API Response GET /gear-inspections/loadwise/', response.data);
    return response.data;
  },

  // Get loads list for a lead (load-level inspection summary)
  getLeadLoads: async (leadId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-inspection/loads/${leadId}/`);

    const response = await axiosInstance.get(`/gear-inspection/loads/${leadId}/`);

    console.log('✅ API Response GET /gear-inspection/loads/', response.data);
    return response.data;
  },

  // Get firefighter roster list for inspections for a lead
  getInspectionRosters: async (leadId: number, page: number = 1, pageSize: number = 20): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-inspections/rosters/${leadId}/?page=${page}&page_size=${pageSize}`);

    const response = await axiosInstance.get(`/gear-inspections/rosters/${leadId}/`, {
      params: {
        page: page,
        page_size: pageSize,
      },
    });

    console.log('✅ API Response GET /gear-inspections/rosters/', response.data);
    return response.data;
  },

  // Get firefighter inspection information
  getFirefighterInspectionInfo: async (leadId: number, rosterId: number): Promise<any> => {
    console.log(
      `➡️ API CALL /firefighter-inspection-information/?lead_id=${leadId}&roster_id=${rosterId}`,
    );
    const response = await axiosInstance.get(`/firefighter-inspection-information/`, {
      params: {
        lead_id: leadId,
        roster_id: rosterId,
      },
    });
    console.log('✅ API Response /firefighter-inspection-information/', response.data);
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