// Map Module Type Definitions

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends GeoPoint {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapNode extends GeoPoint {
  id: string;
  type: 'OLT' | 'Splitter' | 'FAT' | 'ATB' | 'DomeClosure' | 'UndergroundClosure' | 'PedestalCabinet' | 'Junction' | 'MiniNode' | 'DPBox';
  nodeId: string;
  name: string;
  category?: 'Feeder' | 'Distribution' | 'Drop';
  powerIn?: number;
  powerOut?: number;
  description?: string;
  assignedTech?: string;
  attachments?: string[];
  notes?: string[];
  lastUpdate?: number;
  source?: 'manual' | 'bluetooth' | 'gps';
}

export interface FiberLine {
  id: string;
  startNodeId: string;
  endNodeId: string;
  straightDistance: number;
  routeDistance: number;
  cableLength: number;
  slackPercentage: number;
  points: GeoPoint[];
  type: 'feeder' | 'distribution' | 'drop';
  createdAt: number;
  lastUpdate: number;
}

export interface PowerReading {
  id: string;
  nodeId: string;
  powerIn: number;
  powerOut: number;
  loss: number;
  splitterType?: string;
  method: 'manual' | 'bluetooth';
  timestamp: number;
  technicianId?: string;
}

export interface DailyReport {
  id: string;
  date: string;
  technicianId: string;
  actions: ReportAction[];
  totalDistance: number;
  nodesAdded: number;
  powerReadings: number;
  jobsCompleted: number;
}

export interface ReportAction {
  type: 'node_add' | 'line_add' | 'power_read' | 'splice_loss' | 'route_draw' | 'inventory_use' | 'issue_report';
  timestamp: number;
  location: GeoPoint;
  nodeId?: string;
  details: Record<string, any>;
  gpsStamp: GeoPoint;
}

export interface NodeLink {
  parentId: string;
  childId: string;
  fiberLineId?: string;
  linkType: 'parent-child' | 'peer' | 'splitter';
  createdAt: number;
}

export interface MapLayerVisibility {
  olts: boolean;
  splitters: boolean;
  fats: boolean;
  atbs: boolean;
  closures: boolean;
  fiberLines: boolean;
  powerReadings: boolean;
  jobs: boolean;
  inventory: boolean;
  issues: boolean;
}

export interface SyncData {
  nodes: MapNode[];
  lines: FiberLine[];
  readings: PowerReading[];
  links: NodeLink[];
  reports: DailyReport[];
  timestamp: number;
}
