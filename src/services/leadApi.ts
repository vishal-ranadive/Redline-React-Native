// src/services/leadApi.ts
import { axiosInstance } from './api';

export const leadApi = {
  getLeads: async (params?: any): Promise<any> => {
    const response = await axiosInstance.get(`/leads/`, { params });
    return response.data;
  },

  getLeadById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/leads/${id}/`);
    return response.data;
  },

  updateLeadStatus: async (id: number, status: string): Promise<void> => {
    await axiosInstance.put(`/leads/${id}/`, { status });
  },

  assignTechnician: async (leadId: number, technicianId: number): Promise<void> => {
    await axiosInstance.post(`/leads/technician/${leadId}/`, { 
     technician_id: technicianId 
    });
  },

  unassignTechnician: async (leadId: number, technicianId: number): Promise<void> => {
    await axiosInstance.delete(`/leads/technician/${leadId}/`, {
      data: { technician_id: technicianId }
    });
  },
};