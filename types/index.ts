export interface User {
  _id: string;
  name: string;
  email: string;
  role?: 'operator' | 'administrator';
}

export interface Equipment {
  _id: string;
  name: string;
  category: 'loading' | 'transport';
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  _id: string;
  name: string;
  type: 'ore' | 'mineral' | 'waste' | 'processed' | 'other';
  properties?: {
    density?: number;
    volume?: number;
    gradePercentage?: number;
    moistureContent?: number;
    customFields?: Array<{
      name: string;
      value: any;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  name: string;
  activityType: 'loading' | 'transport' | 'general';
  activityDetails?: {
    stopped_reason: string[];
    waiting_reason: string[];
    custom_reason: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Operation {
  _id?: string;
  equipment: string | Equipment;
  operator: string;
  activity: string | Activity;
  material?: string | Material;
  truckBeingLoaded?: string | Equipment;
  miningFront?: string;
  destination?: string;
  distance?: number;
  activityDetails?: string;
  startTime: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
}
