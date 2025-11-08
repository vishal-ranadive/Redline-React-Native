// Simple mapping function - add this to your leads.ts or directly in component
export const mapApiLeadToLeadItem = (apiLead: any) => {
  return {
    id: apiLead.id?.toString() || 'Unknown',
    name: apiLead.odoo?.salePersonName || 'Unknown Customer',
    phone: '555-000-0000', // Dummy phone
    email: 'customer@example.com', // Dummy email
    station: apiLead.firestation?.name || 'Unknown Station',
    status: apiLead.status || 'Unknown',
    leadType: apiLead.type === 'REPAIR' ? 'Repair' : 'Inspection',
    department: apiLead.firestation?.name || 'Unknown Department',
    appointmentDate: apiLead.scheduledDate 
      ? new Date(apiLead.scheduledDate).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : 'Date not set'
  };
};