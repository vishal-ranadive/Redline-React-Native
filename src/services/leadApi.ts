// src/services/leadApi.ts
import { axiosInstance } from './api';

export const leadApi = {
  createLead: async (leadData: {
    franchise_id: number;
    firestation_id: number;
    schedule_date: string;
    type: 'Repair' | 'Inspection';
    repair_cost?: number;
  }): Promise<any> => {
    console.log('➡️ API CALL POST /leads/ with', leadData);
    const response = await axiosInstance.post('/leads/', leadData);
    console.log('✅ API Response POST /leads/', response.data);
    return response.data;
  },

  getLeads: async (params?: any): Promise<any> => {

    console.log('➡️ API CALL /leads/ with', params);
    const response = await axiosInstance.get(`/leads/`, { params });
    console.log('✅ API Response /leads/ with', response.data);
    return response.data;
  },

  getLeadById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/leads/${id}/`);
    return response.data;
  },

  // updateLeadStatus: async (id: number, status: string): Promise<void> => {
  //   await axiosInstance.put(`/leads/${id}/`, { status });
  // },
  updateLead: async (id: number, updateData: any): Promise<void> => {
    await axiosInstance.put(`/leads/${id}/`, updateData);
  },

  assignTechnician: async (leadId: number, technicianId: number): Promise<void> => {
    await axiosInstance.post(`/lead/technician/${leadId}/`, { 
     technician_id: technicianId 
    });
  },

  unassignTechnician: async (leadId: number, technicianId: number): Promise<void> => {
    await axiosInstance.delete(`/lead/technician/${leadId}/`, {
      data: { technician_id: technicianId }
    });
  },

  // Get PPE inspection data
  getPpeInspection: async (leadId: number): Promise<any> => {
    console.log(`➡️ API CALL /ppe-inspection/${leadId}/`);
    const response = await axiosInstance.get(`/ppe-inspection/${leadId}/`);
    console.log(`✅ API Response /ppe-inspection/${leadId}/`, response.data);
    return response.data;
  },

  // Get inspection analytics data
  getInspectionAnalytics: async (leadId: number): Promise<any> => {
    console.log(`➡️ API CALL /inspection-analytics/${leadId}/`);
    const response = await axiosInstance.get(`/inspection-analytics/${leadId}/`);
    console.log(`✅ API Response /inspection-analytics/${leadId}/`, response.data);
    return response.data;
  },

  // Simulate API call to get PDF URL (replace with actual endpoint when available)
  getInspectionPdf: async (leadId: number): Promise<string> => {
    console.log(`➡️ API CALL /inspection-pdf/${leadId}/ (simulated)`);
    // Simulate API delay
    await new Promise((resolve:any) => setTimeout(resolve, 1000));
    // For now, return the sample PDF URL
    // TODO: Replace with actual API call: const response = await axiosInstance.get(`/inspection-pdf/${leadId}/`);
    const pdfUrl = 'https://www.eks-intec.com/wp-content/uploads/2025/01/Sample-pdf.pdf';
    console.log(`✅ API Response /inspection-pdf/${leadId}/`, pdfUrl);
    return pdfUrl;
  },
};