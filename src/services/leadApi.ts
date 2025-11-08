import { axiosInstance } from './api';

export const leadApi = {
  getLeads: async (page: number = 1, pageSize: number = 20): Promise<any> => {
    const response = await axiosInstance.get(`/leads/`);
    return response.data;
  },

  getLeadById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/leads/${id}/`);
    return response.data;
  },

  updateLeadStatus: async (id: number, status: string): Promise<void> => {
    await axiosInstance.patch(`/leads/${id}/`, { status });
  },
};