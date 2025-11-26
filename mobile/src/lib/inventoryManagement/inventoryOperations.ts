import { InventoryItem, StockMovement, InventoryAlert, InventoryStats } from './types';

export function createInventoryItem(
  name: string,
  type: string,
  description: string,
  minimumStock: number,
  costPerUnit: number,
  supplier: string
): InventoryItem {
  const itemId = `INV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  
  return {
    id: itemId,
    itemId,
    name,
    type: type as any,
    description,
    currentStock: 0,
    minimumStock,
    maximumStock: minimumStock * 3,
    unit: 'piece',
    costPerUnit,
    supplier,
    lastRestocked: new Date().toISOString(),
    location: 'Warehouse A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateStock(item: InventoryItem, newQuantity: number): InventoryItem {
  return {
    ...item,
    currentStock: newQuantity,
    updatedAt: new Date().toISOString(),
  };
}

export function recordStockMovement(
  item: InventoryItem,
  quantity: number,
  type: 'In' | 'Out' | 'Adjustment',
  reason: string,
  recordedBy: string
): { item: InventoryItem; movement: StockMovement } {
  const newQuantity = type === 'In' ? item.currentStock + quantity : item.currentStock - quantity;
  const movement: StockMovement = {
    id: `MOV-${Date.now()}`,
    itemId: item.id,
    type,
    quantity,
    reason,
    recordedBy,
    timestamp: new Date().toISOString(),
  };

  return {
    item: updateStock(item, Math.max(0, newQuantity)),
    movement,
  };
}

export function getLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(item => item.currentStock <= item.minimumStock);
}

export function getInventoryStats(items: InventoryItem[]): InventoryStats {
  const lowStock = getLowStockItems(items);
  const totalValue = items.reduce((acc, item) => acc + (item.currentStock * item.costPerUnit), 0);
  
  return {
    totalItems: items.length,
    lowStockItems: lowStock.length,
    totalValue,
    averageTurnoverRate: items.length > 0 ? (items.reduce((acc, i) => acc + i.currentStock, 0) / items.length) : 0,
    activeAlerts: lowStock.length,
  };
}

export function generateStockAlert(item: InventoryItem): InventoryAlert | null {
  if (item.currentStock <= item.minimumStock) {
    return {
      id: `ALERT-${Date.now()}`,
      itemId: item.id,
      alertType: 'LowStock',
      message: `${item.name} stock level is low (${item.currentStock}/${item.minimumStock})`,
      severity: item.currentStock === 0 ? 'Critical' : item.currentStock < item.minimumStock / 2 ? 'High' : 'Medium',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
  }
  
  if (item.currentStock >= item.maximumStock) {
    return {
      id: `ALERT-${Date.now()}`,
      itemId: item.id,
      alertType: 'HighStock',
      message: `${item.name} stock level is high (${item.currentStock}/${item.maximumStock})`,
      severity: 'Low',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export function searchInventory(items: InventoryItem[], query: string): InventoryItem[] {
  const lower = query.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(lower) ||
    item.itemId.toLowerCase().includes(lower) ||
    item.supplier.toLowerCase().includes(lower)
  );
}

export function filterByType(items: InventoryItem[], type: string): InventoryItem[] {
  return items.filter(item => item.type === type);
}
