// Customer Management Types
export type ServiceType = 'Residential' | 'Commercial' | 'Industrial';
export type CustomerStatus = 'Active' | 'Inactive' | 'Pending' | 'Disconnected';

export interface ONTReading {
  timestamp: string;
  powerLevel: number; // dBm
  status: 'Online' | 'Offline' | 'Degraded';
  technicianId: string;
  notes?: string;
}

export interface Customer {
  id: string;
  customerId: string; // User-friendly ID
  name: string;
  accountNumber: string;
  serviceType: ServiceType;
  status: CustomerStatus;
  latitude: number;
  longitude: number;
  address: string;
  contactPhone: string;
  contactEmail: string;
  
  // Network Info
  fatId?: string; // Parent FAT closure
  splitterOutputPort?: number;
  dropCableLength: number; // meters
  cableType: string;
  
  // ONT Info
  ontSerialNumber?: string;
  ontModel?: string;
  ontPowerReadings: ONTReading[];
  
  // Performance
  currentPowerLevel?: number;
  minThresholdPower: number; // dBm
  alertThreshold: number; // dBm
  
  // Management
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes: string;
  photoUrls?: string[];
  synced: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  byServiceType: Record<ServiceType, number>;
  totalDropLength: number;
  ontOfflineCount: number;
  lowPowerCount: number;
}
