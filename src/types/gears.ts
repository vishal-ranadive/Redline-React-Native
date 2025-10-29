export type GearCategory = 'Helmet' | 'Jacket' | 'Gloves' | 'Boots' | 'Hood' | 'Cylinder';

export type GearItem = {
  id: string;
  name: string;
  category: GearCategory;
  description?: string;
  available: boolean;
  sku?: string;
  image?: any;
};