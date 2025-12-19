// src/services/repairApi.ts
import { axiosInstance } from './api';

export const repairApi = {
  // Create gear repair
  createGearRepair: async (repairData: {
    lead_id: number;
    firestation_id: number;
    gear_id: number;
    roster_id?: number | null;
    franchise_id: number;
    repair_status: 'completed' | 'rejected';
    repair_sub_total: number;
    repair_image_url: string[];
    remarks: string;
    repair_qty: number;
    repair_tag: string;
    spear_gear: boolean;
    slug?: string;
  }): Promise<any> => {
    console.log('➡️ API CALL POST /gear-repair/ with', repairData);

    const response = await axiosInstance.post(`/gear-repair/`, repairData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ API Response POST /gear-repair/', response.data);
    return response.data;
  },

  // Update gear repair
  updateGearRepair: async (gearRepairId: number, repairData: {
    lead_id: number;
    firestation_id: number;
    gear_id: number;
    roster_id?: number | null;
    franchise_id: number;
    repair_status: 'completed' | 'rejected';
    repair_sub_total: number;
    repair_image_url: string[];
    remarks: string;
    repair_qty: number;
    repair_tag: string;
    spear_gear: boolean;
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
