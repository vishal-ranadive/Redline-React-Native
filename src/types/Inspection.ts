export type InspectionStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export type InspectionItem = {
  id?: string;
  title: string;
  station: string;
  inspector?: string;
  date?: string;
  count: number; // number of items in this inspection group
  image?: string;
};