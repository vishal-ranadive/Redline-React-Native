// src/constants/leadStatuses.ts

import { printTable } from "../utils/printTable";

/**
 * Lead Status Constants
 * 
 * This file contains all status definitions for Repair and Inspection leads.
 * To add/remove statuses, simply update the arrays below.
 * All changes will automatically reflect throughout the app.
 */

// Inspection lead status types
export type InspectionStatus = 
  | 'Scheduled' 
  | 'Ongoing' 
  | 'Completed' 
  | 'Canceled' 
  | 'Rescheduled';

// Repair lead status types  
export type RepairStatus = 
  | 'IntransitPre'
  | 'RecievedByCorporate'
  | 'RecievedByFranchies'
  | 'OngoingPreRepair'
  | 'OngoingPostRepair'
  | 'RepairComplete'
  | 'IntransitPostRepair';

// Combined type for all possible lead statuses
export type LeadStatus = InspectionStatus | RepairStatus;

// Inspection status configurations with icons and labels
export const INSPECTION_STATUSES: { status: InspectionStatus; icon: string; label: string }[] = [
  { status: 'Ongoing', icon: 'progress-clock', label: 'Ongoing' },
  { status: 'Completed', icon: 'check-circle', label: 'Completed' },
  { status: 'Canceled', icon: 'close-circle', label: 'Canceled' },
  { status: 'Rescheduled', icon: 'calendar-refresh', label: 'Rescheduled' },
];

// Repair status configurations with icons and labels
export const REPAIR_STATUSES: { status: RepairStatus; icon: string; label: string }[] = [
  { status: 'IntransitPre', icon: 'truck-delivery', label: 'Intransit Pre' },
  { status: 'RecievedByCorporate', icon: 'office-building', label: 'Recieved By Corporate' },
  { status: 'RecievedByFranchies', icon: 'store', label: 'Recieved By Franchies' },
  { status: 'OngoingPreRepair', icon: 'hammer-wrench', label: 'Ongoing Pre Repair' },
  { status: 'OngoingPostRepair', icon: 'hammer', label: 'Ongoing Post Repair' },
  { status: 'RepairComplete', icon: 'check-all', label: 'Complete' },
  { status: 'IntransitPostRepair', icon: 'truck-check', label: 'Intransit Post Repair' },
];

// Common statuses that apply to both types
export const COMMON_STATUSES: { status: 'Scheduled'; icon: string; label: string }[] = [
  { status: 'Scheduled', icon: 'calendar-check', label: 'Scheduled' },
];

/**
 * Get statuses based on lead type with clear separation
 * @param leadType - 'REPAIR' or 'INSPECTION'
 * @returns Array of status configurations for the given lead type
 */
export const getStatusesByType = (leadType: 'REPAIR' | 'INSPECTION') => {
  const common = COMMON_STATUSES;
  const specific = leadType === 'REPAIR' ? REPAIR_STATUSES : INSPECTION_STATUSES;
  return [...common, ...specific];
};

/**
 * Get all available statuses grouped by type (for dropdown with sections)
 */
export const getAllStatusesGrouped = () => [
  {
    title: 'Common Statuses',
    data: COMMON_STATUSES,
    type: 'common' as const
  },
    {
    title: 'Inspection Statuses', 
    data: INSPECTION_STATUSES,
    type: 'inspection' as const
  },
  {
    title: 'Repair Statuses',
    data: REPAIR_STATUSES,
    type: 'repair' as const
  },

];

/**
 * Validate if a status is valid for the given lead type
 * @param status - The status to validate
 * @param leadType - 'REPAIR' or 'INSPECTION' 
 * @returns boolean indicating if the status is valid
 */
export const isValidStatusForType = (status: LeadStatus, leadType: 'REPAIR' | 'INSPECTION'): boolean => {
  const commonStatuses = COMMON_STATUSES.map(s => s.status);
  const specificStatuses = leadType === 'REPAIR' 
    ? REPAIR_STATUSES.map(s => s.status)
    : INSPECTION_STATUSES.map(s => s.status);
  
  return [...commonStatuses, ...specificStatuses].includes(status);
};

/**
 * Get color for a status (used for badges, dots, etc.)
 * @param status - The status to get color for
 * @returns Hex color code
 */
export const getStatusColor = (status: LeadStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status.trim() === '') {
    return '#9E9E9E'; // Default gray color for unknown status
  }

  const statusColors: Record<string, string> = {
    // Common Status Colors
    'Scheduled': '#FB8C00',

    // Inspection Status Colors
    'Ongoing': '#FFC107',
    'Completed': '#34A853',
    'Canceled': '#EA4335',
    'Rescheduled': '#1E88E5',

    // Repair Status Colors
    'IntransitPre': '#FF9800',
    'RecievedByCorporate': '#2196F3',
    'RecievedByFranchies': '#2196F3',
    'OngoingPreRepair': '#FFC107',
    'OngoingPostRepair': '#FFC107',
    'RepairComplete': '#34A853',
    'IntransitPostRepair': '#4CAF50',
  };

  return statusColors[status] || '#9E9E9E';
};

/**
 * Format status for display (converts camelCase to readable text)
 * @param status - The status to format
 * @returns Formatted display text
 */
export const formatStatus = (status: LeadStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status.trim() === '') {
    return 'Unknown Status';
  }

  // printTable("status", status)
  return status
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};