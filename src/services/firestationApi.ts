// src/services/firestationApi.ts
import { axiosInstance } from './api';

export interface Firestation {
  firestation_id: number;
  fire_station_name: string;
  email: string | null;
  phone: string | null;
  address: string;
  city: string;
  zip_code: string;
  state: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  active_status: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
  franchise: {
    id: number;
    name: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
}

export interface FirestationResponse {
  status: boolean;
  message: string;
  firestations: Firestation[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

export const firestationApi = {
  getFirestations: async (params?: {
    page?: number;
    page_size?: number;
    fire_station_name?: string;
  }): Promise<FirestationResponse> => {
    console.log('➡️ API CALL /firestation/ with', params);
    const response = await axiosInstance.get('/firestation/', { params });
    console.log('✅ API Response /firestation/', response.data);
    return response.data;
  },

  getFirestationsByFranchise: async (
    franchiseId: number,
    params?: {
      page?: number;
      page_size?: number;
    }
  ): Promise<FirestationResponse> => {
    console.log(`➡️ API CALL /firestation/franchise/${franchiseId} with`, params);
    const response = await axiosInstance.get(`/firestation/franchise/${franchiseId}`, { params });
    console.log(`✅ API Response /firestation/franchise/${franchiseId}`, response.data);
    return response.data;
  },

  getFirestationById: async (id: number): Promise<Firestation> => {
    console.log(`➡️ API CALL /firestation/${id}/`);
    const response = await axiosInstance.get(`/firestation/${id}/`);
    console.log(`✅ API Response /firestation/${id}/`, response.data);
    return response.data;
  },
};
