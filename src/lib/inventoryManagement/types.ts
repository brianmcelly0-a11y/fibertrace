export type InventoryItemType = 'Cable' | 'Splitter' | 'Splice' | 'Closure' | 'Connector' | 'Tool' | 'Other';
export type StockUnit = 'piece' | 'meter' | 'box' | 'roll' | 'set';

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: InventoryItemType;
  description: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: StockUnit;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
  location: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'In' | 'Out' | 'Adjustment';
  quantity: number;
  reason: string;
  jobId?: string;
  recordedBy: string;
  timestamp: string;
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  alertType: 'LowStock' | 'HighStock' | 'Expired' | 'Damaged';
  message: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  averageTurnoverRate: number;
  activeAlerts: number;
}
