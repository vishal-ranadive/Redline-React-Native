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