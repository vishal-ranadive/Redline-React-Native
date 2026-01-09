// src/services/repairApi.ts
import { axiosInstance } from './api';
import { Platform } from 'react-native';

export const repairApi = {
  // Get repair findings
  getRepairFindings: async (): Promise<any> => {
    console.log('➡️ API CALL GET /repair-findings/');

    const response = await axiosInstance.get('/repair-findings/');

    console.log('✅ API Response GET /repair-findings/', response.data);
    return response.data;
  },

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

  // Get firefighter repair information with pagination
  getFirefighterRepairInformationWithPagination: async (params: {
    lead_id: number;
    roster_id: number;
    page?: number;
    page_size?: number;
  }): Promise<any> => {
    console.log(
      `➡️ API CALL GET /firefighter-repair-information/?lead_id=${params.lead_id}&roster_id=${params.roster_id}&page=${params.page}&page_size=${params.page_size}`,
    );
    const response = await axiosInstance.get(`/firefighter-repair-information/`, {
      params,
    });
    console.log('✅ API Response GET /firefighter-repair-information/', response.data);
    return response.data;
  },

  // Upload repair image to S3
  uploadRepairImage: async (formData: FormData, retryCount: number = 0): Promise<any> => {
    const maxRetries = Platform.OS === 'ios' ? 3 : 2; // iOS gets 3 retries, Android gets 2
    const timeoutDuration = 2400000; // 40 minutes for both iOS and Android
    
    try {
      // Log FormData contents for debugging
      if (formData && (formData as any)._parts) {
        const parts = (formData as any)._parts;
        console.log(`📦 FormData contents (${parts.length} parts):`);
        parts.forEach((part: any[], index: number) => {
          if (part[0] === 'image') {
            console.log(`  Part ${index}: image - URI: ${part[1]?.uri}, Name: ${part[1]?.name}, Type: ${part[1]?.type}`);
          } else {
            console.log(`  Part ${index}: ${part[0]} = ${part[1]}`);
          }
        });
      }

      console.log(`➡️ API CALL POST /upload-repair-image/ (attempt ${retryCount + 1}/${maxRetries + 1})`, {
        platform: Platform.OS,
        timeout: timeoutDuration
      });

      // DO NOT manually set Content-Type header for FormData
      // The request interceptor will automatically remove the default 'application/json' header
      // React Native will then automatically set 'multipart/form-data' with the correct boundary
      const response = await axiosInstance.post(`/upload-repair-image/`, formData, {
        timeout: timeoutDuration, // Platform-specific timeout
        // Don't transform the request - let FormData handle it
        transformRequest: (data: any) => data,
      });

      console.log('✅ API Response POST /upload-repair-image/', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error uploading repair image (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: error.message,
        code: error.code,
        platform: Platform.OS,
        timeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
        hasResponse: !!error.response,
        responseStatus: error.response?.status,
      });

      // Check if it's a retryable error (timeout OR network error)
      const isTimeoutError = error.code === 'ECONNABORTED' || 
                            error.message?.includes('timeout') || 
                            error.message?.includes('TIMEOUT');
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.message?.includes('Network Error');
      const isRetryableError = isTimeoutError || isNetworkError;
      
      if (isRetryableError && retryCount < maxRetries) {
        const errorType = isTimeoutError ? 'timeout' : 'network error';
        const delayMs = (retryCount + 1) * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`🔄 Retrying repair image upload (attempt ${retryCount + 2}/${maxRetries + 1}) after ${errorType}...`);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        return repairApi.uploadRepairImage(formData, retryCount + 1);
      }

      // Re-throw the error if we can't retry
      console.error(`❌ All ${maxRetries + 1} upload attempts failed. Giving up.`);
      throw error;
    }
  },

  // Create gear repair
  createGearRepair: async (repairData: {
    lead_id: number;
    firestation_id: number;
    gear_id: number;
    roster_id?: number | null;
    franchise_id: number;
    repair_status: 'complete' | 'incomplete';
    repair_sub_total: number;
    repair_cost: number;
    remarks: string;
    repair_items: Array<{
      repair_finding_id: number;
      repair_quantity: number;
      repair_cost: string;
      images: string[];
    }>;
    spare_gear: boolean;
  }): Promise<any> => {
    console.log('➡️ API CALL POST /gear-repair/ with', repairData);

    const response = await axiosInstance.post(`/gear-repair/`, repairData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ API Response POST /gear-repair/', response.data);
    return response.data;
  },

  // Get all gear repairs for a firestation
  getAllGearRepairs: async (firestationId: number, params?: { 
    page?: number; 
    page_size?: number;
    lead_id?: number;
    repair_status?: 'complete' | 'incomplete';
    name?: string;
  }): Promise<any> => {
    // Build query params - always include firestation_id and lead_id, only include optional params if provided
    const queryParams: any = {
      firestation_id: firestationId,
    };

    // Always include lead_id if provided (should always be provided from screen)
    if (params?.lead_id) {
      queryParams.lead_id = params.lead_id;
    }

    // Only include optional params if they have values
    if (params?.page !== undefined && params.page !== null) {
      queryParams.page = params.page;
    }
    if (params?.page_size !== undefined && params.page_size !== null) {
      queryParams.page_size = params.page_size;
    }
    if (params?.repair_status !== undefined && params.repair_status !== null) {
      queryParams.repair_status = params.repair_status;
    }
    if (params?.name !== undefined && params.name !== null && params.name.trim()) {
      queryParams.name = params.name.trim();
    }

    console.log(`➡️ API CALL GET /gear-repair/`, queryParams);

    const response = await axiosInstance.get(`/gear-repair/`, {
      params: queryParams,
    });

    console.log('✅ API Response GET /gear-repair/', response.data);
    return response.data;
  },

  // Get repair rosters for a lead
  getRepairRosters: async (leadId: number, page?: number, pageSize?: number, name?: string): Promise<any> => {
    console.log(`➡️ API CALL GET /gear-repair/rosters/${leadId}/?page=${page}&page_size=${pageSize}&name=${name}`);

    const response = await axiosInstance.get(`/gear-repair/rosters/${leadId}/`, {
      params: {
        ...(page && { page }),
        ...(pageSize && { page_size: pageSize }),
        ...(name && { name }),
      },
    });

    console.log(`✅ API Response GET /gear-repair/rosters/${leadId}/`, response.data);
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
    repair_status?: 'complete' | 'incomplete';
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
