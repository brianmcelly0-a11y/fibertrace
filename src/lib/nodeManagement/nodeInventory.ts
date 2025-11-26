// Node Inventory Tracking Workflow

import { Node, InventoryUsed } from './types';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  partNumber?: string;
  initialQuantity: number;
  currentQuantity: number;
}

/**
 * Add inventory usage to node
 */
export function addInventoryUsage(
  node: Node,
  itemId: string,
  itemName: string,
  quantity: number,
  condition?: string,
  technicianName: string = 'Unknown'
): Node {
  const usage: InventoryUsed = {
    itemId,
    itemName,
    quantity,
    condition,
    timestamp: new Date(),
  };

  node.inventoryUsed.push(usage);
  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Common fiber optic inventory items
 */
export const COMMON_INVENTORY_ITEMS = [
  // Splitters
  { id: 'spl-1-2', name: 'Splitter 1:2', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-4', name: 'Splitter 1:4', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-8', name: 'Splitter 1:8', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-16', name: 'Splitter 1:16', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-32', name: 'Splitter 1:32', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-64', name: 'Splitter 1:64', category: 'Splitter', typicalQuantity: 1 },
  { id: 'spl-1-128', name: 'Splitter 1:128', category: 'Splitter', typicalQuantity: 1 },

  // Cables
  { id: 'cable-drop', name: 'Drop Cable', category: 'Cable', typicalQuantity: 100 },
  { id: 'cable-trunk', name: 'Trunk Fiber', category: 'Cable', typicalQuantity: 100 },
  { id: 'cable-service', name: 'Service Cable', category: 'Cable', typicalQuantity: 50 },

  // Connectors
  { id: 'conn-sc-apc', name: 'SC/APC Connector', category: 'Connector', typicalQuantity: 10 },
  { id: 'conn-lc-apc', name: 'LC/APC Connector', category: 'Connector', typicalQuantity: 10 },
  { id: 'conn-fc-apc', name: 'FC/APC Connector', category: 'Connector', typicalQuantity: 5 },

  // Splice Protection
  { id: 'splice-prot', name: 'Splice Protector', category: 'Splice', typicalQuantity: 25 },
  { id: 'heat-shrink', name: 'Heat Shrink', category: 'Splice', typicalQuantity: 50 },
  { id: 'fusion-tape', name: 'Fusion Splice Tape', category: 'Splice', typicalQuantity: 25 },

  // Closure Kits
  { id: 'closure-dome', name: 'Dome Closure Kit', category: 'Closure', typicalQuantity: 5 },
  { id: 'closure-flat', name: 'Flat Closure Kit', category: 'Closure', typicalQuantity: 5 },
  { id: 'closure-ug', name: 'Underground Closure Kit', category: 'Closure', typicalQuantity: 3 },

  // Termination
  { id: 'term-pigtail', name: 'Fiber Pigtail', category: 'Termination', typicalQuantity: 10 },
  { id: 'term-patch', name: 'Patch Cable', category: 'Termination', typicalQuantity: 10 },
];

/**
 * Track inventory usage by category
 */
export function getInventorySummary(node: Node): Record<string, { total: number; items: InventoryUsed[] }> {
  const summary: Record<string, { total: number; items: InventoryUsed[] }> = {};

  node.inventoryUsed.forEach(item => {
    if (!summary[item.itemName]) {
      summary[item.itemName] = { total: 0, items: [] };
    }
    summary[item.itemName].total += item.quantity;
    summary[item.itemName].items.push(item);
  });

  return summary;
}

/**
 * Generate inventory report for multiple nodes
 */
export function generateInventoryReport(nodes: Node[]): {
  totalByItem: Record<string, number>;
  totalByCategoryByItem: Record<string, Record<string, number>>;
  nodesWithHighUsage: Array<{ node: Node; totalItems: number }>;
} {
  const totalByItem: Record<string, number> = {};
  const totalByCategoryByItem: Record<string, Record<string, number>> = {};

  nodes.forEach(node => {
    node.inventoryUsed.forEach(item => {
      totalByItem[item.itemName] = (totalByItem[item.itemName] || 0) + item.quantity;

      // Find category for this item
      const catalogItem = COMMON_INVENTORY_ITEMS.find(cat => cat.name === item.itemName);
      const category = catalogItem?.category || 'Other';

      if (!totalByCategoryByItem[category]) {
        totalByCategoryByItem[category] = {};
      }
      totalByCategoryByItem[category][item.itemName] = 
        (totalByCategoryByItem[category][item.itemName] || 0) + item.quantity;
    });
  });

  // Get nodes with high usage
  const nodesWithHighUsage = nodes
    .map(node => ({
      node,
      totalItems: node.inventoryUsed.reduce((sum, item) => sum + item.quantity, 0),
    }))
    .filter(item => item.totalItems > 0)
    .sort((a, b) => b.totalItems - a.totalItems)
    .slice(0, 10);

  return {
    totalByItem,
    totalByCategoryByItem,
    nodesWithHighUsage,
  };
}

/**
 * Estimate inventory needed for job
 */
export function estimateInventoryForJob(
  nodeCount: number,
  hasSplitters: boolean = true,
  estimatedDistance: number = 5 // km
): InventoryUsed[] {
  const estimated: InventoryUsed[] = [];

  // Base items per node
  estimated.push({
    itemId: 'splice-prot',
    itemName: 'Splice Protector',
    quantity: nodeCount * 2,
    timestamp: new Date(),
  });

  // Cable (rough estimate)
  estimated.push({
    itemId: 'cable-trunk',
    itemName: 'Trunk Fiber',
    quantity: Math.ceil(estimatedDistance * 1.15 * 1000), // meters
    timestamp: new Date(),
  });

  // Connectors
  estimated.push({
    itemId: 'conn-sc-apc',
    itemName: 'SC/APC Connector',
    quantity: nodeCount,
    timestamp: new Date(),
  });

  // Splitters if needed
  if (hasSplitters) {
    estimated.push({
      itemId: 'spl-1-8',
      itemName: 'Splitter 1:8',
      quantity: Math.max(1, Math.floor(nodeCount / 4)),
      timestamp: new Date(),
    });
  }

  return estimated;
}

/**
 * Track inventory condition
 */
export function categorizeInventoryCondition(node: Node): {
  newItems: InventoryUsed[];
  usedItems: InventoryUsed[];
  damagedItems: InventoryUsed[];
} {
  const newItems = node.inventoryUsed.filter(i => i.condition === 'new' || !i.condition);
  const usedItems = node.inventoryUsed.filter(i => i.condition === 'used' || i.condition === 'existing');
  const damagedItems = node.inventoryUsed.filter(i => i.condition === 'damaged');

  return { newItems, usedItems, damagedItems };
}

/**
 * Generate inventory usage report
 */
export function generateInventoryUsageReport(nodes: Node[]): string {
  const report = generateInventoryReport(nodes);

  let text = '=== INVENTORY USAGE REPORT ===\n\n';

  text += 'TOTAL BY ITEM:\n';
  Object.entries(report.totalByItem)
    .sort((a, b) => b[1] - a[1])
    .forEach(([item, total]) => {
      text += `- ${item}: ${total}\n`;
    });

  text += '\nTOTAL BY CATEGORY:\n';
  Object.entries(report.totalByCategoryByItem).forEach(([category, items]) => {
    text += `${category}:\n`;
    Object.entries(items).forEach(([item, qty]) => {
      text += `  - ${item}: ${qty}\n`;
    });
  });

  text += '\nTOP NODES BY USAGE:\n';
  report.nodesWithHighUsage.forEach(({ node, totalItems }, idx) => {
    text += `${idx + 1}. ${node.nodeId}: ${totalItems} items\n`;
  });

  return text;
}
