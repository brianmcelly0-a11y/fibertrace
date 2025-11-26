// Closure Management Types
export type ClosureType = 'ATB' | 'FAT' | 'Dome' | 'Inline' | 'PatchPanel' | 'SplitterBox' | 'DistributionPoint';
export type LocationType = 'Pole' | 'Ground' | 'Wall' | 'Cabinet';
export type ClosureStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Damaged' | 'Planning';

export interface Splice {
  id: string;
  fiberIn: string;
  fiberOut: string;
  colorCode: string;
  tubeNumber: number;
  splicingType: 'Fusion' | 'Mechanical';
  lossReading: number; // dB
  jointStatus: 'Good' | 'Fair' | 'Poor';
  photoUrls?: string[];
  timestamp: string;
  technicianId: string;
}

export interface Closure {
  id: string;
  closureId: string; // User-friendly ID
  type: ClosureType;
  label: string;
  latitude: number;
  longitude: number;
  locationType: LocationType;
  fiberCount: number;
  status: ClosureStatus;
  routeIds: string[];
  splices: Splice[];
  powerInput?: number; // dBm
  powerOutput?: number; // dBm
  notes: string;
  photoUrls?: string[];
  maintenanceHistory: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  synced: boolean;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Inspection' | 'Cleaning' | 'Repair' | 'Upgrade';
  description: string;
  technicianId: string;
  findings: string;
}

export interface ClosureStats {
  totalClosures: number;
  byType: Record<ClosureType, number>;
  activeClosures: number;
  totalSplices: number;
  averageSpicesPerClosure: number;
  closuresWithHighLoss: number;
}
