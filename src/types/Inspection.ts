export type InspectionStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export type GroupInspectionItem = {
  id?: string;
  title: string;
  station: string;
  inspector?: string;
  date?: string;
  type?:string;
  count: number; // number of items in this inspection group
  image?: string;
};