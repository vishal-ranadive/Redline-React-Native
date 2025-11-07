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




// src/types/Inspection.ts
export type Gear = {
  id: string;
  name: string;
  type: string;
  status: string;
  isHydrotestPerformed: boolean;
  roster: { id: number; name: string };
  remarks?: string;
  imageUrl?: string;
  serialNumber?: string;
  date?: string;
  hydrotestResult?: string;
  condition?: string;
};

export type Bin = {
  id: string;
  name: string;
  type: string;
  gears: Gear[];
};

export type Load = {
  id: string;
  name: string;
  station?: string;
  createdAt?: string;
  bins: Bin[];
};
