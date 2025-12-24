// src/services/repairApi.ts
import { axiosInstance } from './api';

export const repairApi = {
  // Get firefighter repair information
  getFirefighterRepairInformation: async (leadId: number, rosterId: number): Promise<any> => {
    console.log(
      `➡️ API CALL GET /firefighter-repair-information/?lead_id=${leadId}&roster_id=${rosterId}`,
    );
    const response = await axiosInstance.get(`/firefighter-repair-information/`, {
      params: {
        lead_id: leadId,
        roster_id: rosterId,
      },
    });
    console.log('✅ API Response GET /firefighter-repair-information/', response.data);
    return response.data;
  },

  // Upload repair image to S3
  uploadRepairImage: async (formData: FormData): Promise<any> => {
    console.log('➡️ API CALL POST /upload-repair-image/', formData);

    const response = await axiosInstance.post(`/upload-repair-image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('✅ API Response POST /upload-repair-image/', response.data);
    return response.data;
  },

  // Create gear repair
  createGearRepair: async (repairData: {
    lead_id: number;
    firestation_id: number;
    gear_id: number;
    roster_id?: number | null;
    franchise_id: number;
    repair_status: 'completed' | 'rejected';
    repair_sub_total: number;
    repair_cost: number;
    repair_images: string[];
    remarks: string;
    repair_qty: number;
    repair_tag: string;
    spare_gear: boolean;
    slug?: string;
  }): Promise<any> => {
    console.log('➡️ API CALL POST /gear-repair/ with', repairData);

    const response = await axiosInstance.post(`/gear-repair/`, repairData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ API Response POST /gear-repair/', response.data);
    return response.data;
  },

  // Get all gear repairs for a firestation
  getAllGearRepairs: async (firestationId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-repair/?firestation_id=${firestationId}`);

    const response = await axiosInstance.get(`/gear-repair/`, {
      params: {
        firestation_id: firestationId,
      },
    });

    console.log('✅ API Response GET /gear-repair/', response.data);
    return response.data;
  },

  // Get gear repair by ID
  getGearRepair: async (repairId: number): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-repair/${repairId}/`);

    const response = await axiosInstance.get(`/gear-repair/${repairId}/`);

    console.log(`✅ API Response GET /gear-repair/${repairId}/`, response.data);
    return response.data;
  },

  // Update gear repair
  updateGearRepair: async (gearRepairId: number, repairData: {
    lead_id?: number;
    firestation_id?: number;
    gear_id?: number;
    roster_id?: number | null;
    franchise_id: number;
    repair_status?: 'completed' | 'rejected';
    repair_sub_total?: number;
    repair_cost?: number;
    repair_images?: string[];
    remarks?: string;
    repair_qty?: number;
    repair_tag?: string;
    spare_gear?: boolean;
    slug?: string;
  }): Promise<any> => {
    console.log(`➡️ API CALL PUT /gear-repair/${gearRepairId}/ with`, repairData);

    const response = await axiosInstance.put(`/gear-repair/${gearRepairId}/`, repairData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`✅ API Response PUT /gear-repair/${gearRepairId}/`, response.data);
    return response.data;
  },
};
