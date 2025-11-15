export interface Equipment {
  _id: string;
  name: string;
  type: 'excavator' | 'truck' | 'drill' | 'loader' | 'other';
  registrationNumber: string;
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  _id: string;
  name: string;
  category: 'fuel' | 'explosives' | 'tools' | 'parts' | 'consumables' | 'other';
  quantity: number;
  unit: 'kg' | 'liter' | 'piece' | 'ton' | 'meter';
  location?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id?: string;
  equipment: string;
  activityType: string;
  material?: string;
  truckId?: string;
  details?: string;
  startTime: string;
  endTime?: string;
  status: 'in-progress' | 'completed';
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}
