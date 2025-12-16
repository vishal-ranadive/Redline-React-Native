// src/constants/inspection.ts
export const INSPECTION_CONSTANTS = {
  // Status options
  STATUS_OPTIONS: [
    { value: 'PASS', label: 'PASS', color: '#34A853' },
    { value: 'CORRECTIVE_ACTION_REQUIRED', label: 'CORRECTIVE ACTION REQUIRED', color: '#F9A825' },
    { value: 'RECOMMENDED_OOS', label: 'RECOMMENDED OOS', color: '#f15719ff' },
    { value: 'EXPIRED', label: 'EXPIRED', color: '#ff0303ff' },
  ],

  // Service types
  SERVICE_TYPES: [
    { value: 'INSPECTED_AND_CLEANED', label: 'Inspected and Cleaned' }, //3
    { value: 'CLEANED_ONLY', label: 'Cleaned Only' },//1
    { value: 'INSPECTED_ONLY', label: 'Inspected Only' },//2
    { value: 'SPECIALIZED_CLEANING', label: 'Specialized Cleaning' },//4
    { value: 'OTHER', label: 'Other' },//5
  ],

  // Harness types
  HARNESS_TYPES: [
    { value: 'CLASS_2', label: 'Class 2 - Chest Harness' },
    { value: 'CLASS_3', label: 'Class 3 - Full Body Harness' },
    { value: 'CLASS_4', label: 'Class 4 - Suspension Harness' },
    { value: 'RESCUE', label: 'Rescue Harness' },
    { value: 'TACTICAL', label: 'Tactical Harness' },
  ],

  // Size options
  SIZE_OPTIONS: [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
    { value: 'ONE_SIZE', label: 'One Size' },
  ],

  // Load options
  LOAD_OPTIONS: Array.from({ length: 25 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Load ${i + 1}`
  })),

  // Color options
  COLOR_OPTIONS: [
    { value: 'RED', label: 'Red', color: '#FF4444' },
    { value: 'BLUE', label: 'Blue', color: '#4444FF' },
    { value: 'GREEN', label: 'Green', color: '#44FF44' },
    { value: 'YELLOW', label: 'Yellow', color: '#FFFF44' },
    { value: 'ORANGE', label: 'Orange', color: '#FF8844' },
    { value: 'PURPLE', label: 'Purple', color: '#8844FF' },
    { value: 'PINK', label: 'Pink', color: '#FF44FF' },
    { value: 'CYAN', label: 'Cyan', color: '#44FFFF' },
    { value: 'LIME', label: 'Lime', color: '#88FF44' },
    { value: 'TEAL', label: 'Teal', color: '#44FF88' },
  ],

  // Gear types that require hydro test
  HYDRO_TEST_GEAR_TYPES: [
    'JACKET LINER',
    'PANT LINER', 
    'HOOD'
  ],
};

// Status color mapping by ID (primary method)
export const STATUS_COLOR_BY_ID: { [key: number]: string } = {
  1: '#34A853', // Pass
  2: '#4285F4', // Repair (Blue)
  3: '#9370DB', // Expired (Purple)
  4: '#D93025', // Recommended Out Of Service (Red)
  5: '#FFD700', // Corrective Action Required (Yellow)
  6: '#D93025', // Fail (Red)
  7: '#666666', // N/A (hidden from UI)
  8: '#666666' // OOS (hidden from UI)
};

// Status color mapping by status string (fallback for legacy code)
export const STATUS_COLOR_BY_STRING: { [key: string]: string } = {
  'Pass': '#34A853',
  'Repair': '#4285F4',
  'Expired': '#9370DB',
  'Recommended Out Of Service': '#D93025',
  'Corrective Action Required': '#FFD700',
  'Fail': '#D93025',
  'N/A': '#666666',
  'OOS': '#666666',
};

/**
 * Get status color by ID (preferred) or by status string (fallback)
 * @param statusId - Status ID (number) - optional
 * @param statusString - Status string (e.g., "Pass", "Repair") - optional
 * @returns Color hex code or default gray
 */
export const getStatusColor = (statusId?: number | null, statusString?: string | null): string => {
  // First try to get color by ID (preferred method)
  if (statusId != null && STATUS_COLOR_BY_ID[statusId]) {
    return STATUS_COLOR_BY_ID[statusId];
  }
  
  // Fallback to string-based lookup
  if (statusString) {
    return STATUS_COLOR_BY_STRING[statusString] || '#666666';
  }
  
  // Default fallback
  return '#666666';
};