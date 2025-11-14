export interface GearType {
  gear_type_id: number;
  gear_type: string;
}

export const GEAR_TYPES: GearType[] = [
  {
    gear_type_id: 1,
    gear_type: "Helmet"
  },
  {
    gear_type_id: 2,
    gear_type: "Fire Jacket"
  },
  {
    gear_type_id: 3,
    gear_type: "Fire Gloves"
  },
  {
    gear_type_id: 4,
    gear_type: "Fire Boots"
  },
  {
    gear_type_id: 5,
    gear_type: "Respirator"
  },
  {
    gear_type_id: 6,
    gear_type: "Harness"
  },
  {
    gear_type_id: 7,
    gear_type: "Fire Axe"
  },
  {
    gear_type_id: 8,
    gear_type: "Fire Hose"
  },
  {
    gear_type_id: 9,
    gear_type: "Protective Pants"
  },
  {
    gear_type_id: 10,
    gear_type: "Thermal Imaging Camera"
  }
];

export const GEAR_STATUSES = [
  { label: "New", value: "new" },
  { label: "In Service", value: "in_service" },
  { label: "Under Maintenance", value: "under_maintenance" },
  { label: "Retired", value: "retired" },
  { label: "Damaged", value: "damaged" }
] as const;

export type GearStatus = typeof GEAR_STATUSES[number]['value'];