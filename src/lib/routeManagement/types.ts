// Fiber Route Management Module - Data Types and Interfaces

export type RouteType = 'Backbone' | 'Distribution' | 'Access' | 'Drop';

export type RouteStatus = 
  | 'Completed'
  | 'Under Construction'
  | 'Faulty'
  | 'Pending Survey'
  | 'Archived';

export type FaultType = 
  | 'Cut'
  | 'Low Power'
  | 'Attenuation'
  | 'Water in Closure'
  | 'Pole Damage'
  | 'Rodent Damage'
  | 'Fiber Break'
  | 'Splice Failure'
  | 'Other';

export type CableType = 
  | 'ADSS'
  | 'G652D'
  | 'G657A'
  | 'G657B'
  | 'Armored'
  | 'Aerial'
  | 'Underground'
  | 'Submarine';

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface RouteSegment {
  id: string;
  startCoords: Coordinates;
  endCoords: Coordinates;
  distance: number; // meters
  order: number; // Order in the route
  status: 'normal' | 'faulty' | 'under_maintenance';
}

export interface RouteFault {
  id: string;
  segmentId: string;
  type: FaultType;
  reportedAt: Date;
  reportedBy: string;
  description: string;
  attachments: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  resolved: boolean;
  resolvedAt?: Date;
  repairNotes?: string;
  repairAttachments?: string[];
}

export interface RouteInventory {
  cableType: CableType;
  cableSize: string; // e.g., "12F", "24F", "48F", "96F", "144F"
  totalLength: number; // meters
  reserve: number; // meters - extra cable for slack/coils
  spliceCount: number;
}

export interface Route {
  id: string;
  routeId: string; // User-friendly ID like "ROUTE-001"
  name: string;
  type: RouteType;
  status: RouteStatus;

  // Nodes
  startNodeId: number;
  endNodeId: number;
  startNodeLabel?: string;
  endNodeLabel?: string;

  // Geometry
  segments: RouteSegment[];
  totalDistance: number; // meters
  expectedDistance?: number; // For comparison
  coordinates: Coordinates[];
  color: string; // For map visualization

  // Cable info
  inventory: RouteInventory;
  depth?: number; // For underground routes (meters)

  // Faults
  faults: RouteFault[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: string;
  changeHistory: RouteChangeHistory[];

  // Photos
  attachments: RouteAttachment[];
  notes?: string;

  // Sync
  synced: boolean;
  syncedAt?: Date;
}

export interface RouteChangeHistory {
  id: string;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  timestamp: Date;
  reason?: string;
}

export interface RouteAttachment {
  id: string;
  type: 'photo' | 'document' | 'survey';
  url: string;
  caption?: string;
  timestamp: Date;
}

export interface RouteFilter {
  type?: RouteType;
  status?: RouteStatus;
  hasActiveFaults?: boolean;
  searchTerm?: string;
  nodeId?: number; // Filter by connected node
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface RouteStats {
  totalRoutes: number;
  byType: Record<RouteType, number>;
  byStatus: Record<RouteStatus, number>;
  totalDistance: number; // meters
  totalCableLength: number; // meters
  activeRoutes: number;
  routesWithFaults: number;
  avgDistancePerRoute: number;
  lastSyncTime?: Date;
  unsyncedCount: number;
}

export interface GPSPath {
  points: Coordinates[];
  startTime: Date;
  endTime: Date;
  accuracy: number; // meters
}

export interface RouteCreationInput {
  name: string;
  type: RouteType;
  routeId: string;
  startNodeId: number;
  endNodeId: number;
  inventory: RouteInventory;
  depth?: number;
  coordinates?: Coordinates[];
  expectedDistance?: number;
  notes?: string;
  attachmentUrls?: string[];
}

export interface DistanceSegment {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  bearing?: number;
}
