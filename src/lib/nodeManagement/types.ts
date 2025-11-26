// Node Management Module - Data Types and Interfaces

export type NodeType = 
  | 'OLT'
  | 'Splitter'
  | 'FAT'
  | 'ATB'
  | 'Dome Closure'
  | 'Flat Closure'
  | 'Underground Closure'
  | 'Pedestal Cabinet'
  | 'Mini Node'
  | 'Junction'
  | 'Core Node'
  | 'Access Node'
  | 'Distribution Node';

export type NodeStatus = 
  | 'OK'
  | 'Needs Service'
  | 'Damaged'
  | 'Unknown'
  | 'Under Maintenance'
  | 'Completed';

export type NodeCondition = 
  | 'new'
  | 'existing'
  | 'damaged';

export type UpdateMethod = 'Manual' | 'Bluetooth' | 'OTDR';

export interface NodeCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface PowerReading {
  powerIn: number; // dBm
  powerOut?: number; // dBm
  loss: number; // dB
  timestamp: Date;
  method: UpdateMethod;
  notes?: string;
}

export interface SplitterInfo {
  type: string; // e.g., "1:2", "1:4", "1:8", "1:16", "1:32", "1:64", "1:128"
  portCount: number;
  typicalLoss: number; // dB
  connectedPorts: number[];
}

export interface NodeAttachment {
  id: string;
  type: 'photo' | 'document' | 'measurement';
  url: string;
  caption?: string;
  timestamp: Date;
}

export interface InventoryUsed {
  itemId: string;
  itemName: string;
  quantity: number;
  condition?: string;
  timestamp: Date;
}

export interface LinkedNode {
  nodeId: number;
  relationType: 'parent' | 'child' | 'sibling';
  fiberSegment?: string;
  port?: number;
}

export interface NodeChangeHistory {
  id: string;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  timestamp: Date;
  reason?: string;
}

export interface Node {
  id: number;
  nodeId: string; // User-friendly ID like "FAT-021"
  type: NodeType;
  label: string;
  coordinates: NodeCoordinates;
  status: NodeStatus;
  condition: NodeCondition;
  
  // Power info
  powerReadings: PowerReading[];
  currentPowerIn?: number;
  currentPowerOut?: number;
  
  // Splitter specific
  splitterInfo?: SplitterInfo;
  
  // Network topology
  parentNodeId?: number;
  linkedNodes: LinkedNode[];
  
  // Photos & attachments
  attachments: NodeAttachment[];
  
  // Inventory
  inventoryUsed: InventoryUsed[];
  
  // Maintenance
  lastMaintenance?: Date;
  maintenanceNotes?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: string;
  changeHistory: NodeChangeHistory[];
  
  // Sync
  synced: boolean;
  syncedAt?: Date;
}

export interface NodeReport {
  id: string;
  nodeId: number;
  nodeLabel: string;
  type: 'daily_summary' | 'node_detailed' | 'job_based' | 'fault_summary';
  
  // Report data
  nodeDetails: Partial<Node>;
  powerChain: PowerReading[];
  connectivityChain: LinkedNode[];
  spliceLosses: PowerReading[];
  attachments: NodeAttachment[];
  inventoryUsed: InventoryUsed[];
  
  // Metadata
  technician: string;
  gpsLocation: NodeCoordinates;
  generatedAt: Date;
  
  // Export
  exportedFormat?: 'pdf' | 'json' | 'csv';
  exportedAt?: Date;
}

export interface NodeFilter {
  type?: NodeType;
  status?: NodeStatus;
  condition?: NodeCondition;
  searchTerm?: string;
  needsMaintenance?: boolean;
  hasHighLoss?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface NodeStats {
  totalNodes: number;
  byType: Record<NodeType, number>;
  byStatus: Record<NodeStatus, number>;
  averagePowerLoss: number;
  nodesNeedingService: number;
  lastSyncTime?: Date;
  unsyncedCount: number;
}
