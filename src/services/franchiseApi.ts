// src/services/franchiseApi.ts
import { axiosInstance } from './api';

export interface Franchise {
  franchise_id: number;
  corporate: {
    corporate_id: number;
    corporate_name: string;
  };
  franchise_name: string;
  email: string | null;
  phone: string | null;
  address: string;
  city: string;
  zip_code: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  active_status: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface FranchiseResponse {
  status: boolean;
  message: string;
  franchises: Franchise[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

export const franchiseApi = {
  getFranchises: async (params?: {
    page?: number;
    page_size?: number;
    franchise_name?: string;
  }): Promise<FranchiseResponse> => {
    console.log('➡️ API CALL /franchise/ with', params);
    const response = await axiosInstance.get('/franchise/', { params });
    console.log('✅ API Response /franchise/ with', response.data);
    return response.data;
  },

  getFranchiseById: async (id: number): Promise<Franchise> => {
    console.log(`➡️ API CALL /franchise/${id}/`);
    const response = await axiosInstance.get(`/franchise/${id}/`);
    console.log(`✅ API Response /franchise/${id}/`, response.data);
    return response.data;
  },
};
