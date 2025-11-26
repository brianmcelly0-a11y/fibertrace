// Node Loading & Classification Workflow

import { Node, NodeType, NodeStats, NodeFilter } from './types';

// In-memory node storage (in production, use AsyncStorage)
let nodeDatabase: Node[] = [];

/**
 * Load all nodes from local storage/database
 * Classifies them by type automatically
 */
export async function loadNodeDatabase(): Promise<Node[]> {
  try {
    // In production, load from AsyncStorage or SQLite
    // For now, return in-memory database
    return nodeDatabase;
  } catch (error) {
    console.error('Failed to load node database:', error);
    return [];
  }
}

/**
 * Classify nodes by type
 */
export function classifyNodesByType(nodes: Node[]): Record<NodeType, Node[]> {
  const classified: Record<NodeType, Node[]> = {
    'OLT': [],
    'Splitter': [],
    'FAT': [],
    'ATB': [],
    'Dome Closure': [],
    'Flat Closure': [],
    'Underground Closure': [],
    'Pedestal Cabinet': [],
    'Mini Node': [],
    'Junction': [],
    'Core Node': [],
    'Access Node': [],
    'Distribution Node': [],
  };

  nodes.forEach(node => {
    if (classified[node.type]) {
      classified[node.type].push(node);
    }
  });

  return classified;
}

/**
 * Get node statistics
 */
export function getNodeStats(nodes: Node[]): NodeStats {
  const byType: Record<NodeType, number> = {
    'OLT': 0,
    'Splitter': 0,
    'FAT': 0,
    'ATB': 0,
    'Dome Closure': 0,
    'Flat Closure': 0,
    'Underground Closure': 0,
    'Pedestal Cabinet': 0,
    'Mini Node': 0,
    'Junction': 0,
    'Core Node': 0,
    'Access Node': 0,
    'Distribution Node': 0,
  };

  const byStatus = {
    'OK': 0,
    'Needs Service': 0,
    'Damaged': 0,
    'Unknown': 0,
    'Under Maintenance': 0,
    'Completed': 0,
  };

  let totalLoss = 0;
  let lossCount = 0;
  let nodesNeedingService = 0;
  let unsyncedCount = 0;

  nodes.forEach(node => {
    byType[node.type]++;
    byStatus[node.status]++;
    
    if (node.status === 'Needs Service') nodesNeedingService++;
    if (!node.synced) unsyncedCount++;

    // Calculate average loss
    if (node.powerReadings.length > 0) {
      const latestReading = node.powerReadings[node.powerReadings.length - 1];
      totalLoss += latestReading.loss;
      lossCount++;
    }
  });

  return {
    totalNodes: nodes.length,
    byType,
    byStatus,
    averagePowerLoss: lossCount > 0 ? totalLoss / lossCount : 0,
    nodesNeedingService,
    unsyncedCount,
  };
}

/**
 * Filter nodes by criteria
 */
export function filterNodes(nodes: Node[], filter: NodeFilter): Node[] {
  return nodes.filter(node => {
    if (filter.type && node.type !== filter.type) return false;
    if (filter.status && node.status !== filter.status) return false;
    if (filter.condition && node.condition !== filter.condition) return false;
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      if (!node.label.toLowerCase().includes(term) && 
          !node.nodeId.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    if (filter.needsMaintenance && node.status !== 'Needs Service') return false;
    
    if (filter.hasHighLoss && node.powerReadings.length > 0) {
      const latestReading = node.powerReadings[node.powerReadings.length - 1];
      if (latestReading.loss < 15) return false; // High loss threshold
    }
    
    if (filter.dateRange) {
      const createdDate = new Date(node.createdAt);
      if (createdDate < filter.dateRange.from || createdDate > filter.dateRange.to) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Search nodes by term
 */
export function searchNodes(nodes: Node[], searchTerm: string): Node[] {
  const term = searchTerm.toLowerCase();
  return nodes.filter(node =>
    node.label.toLowerCase().includes(term) ||
    node.nodeId.toLowerCase().includes(term) ||
    node.type.toLowerCase().includes(term)
  );
}

/**
 * Sort nodes by various criteria
 */
export function sortNodes(
  nodes: Node[],
  sortBy: 'id' | 'type' | 'status' | 'powerLoss' | 'lastUpdate'
): Node[] {
  const sorted = [...nodes];

  switch (sortBy) {
    case 'id':
      return sorted.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    
    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    
    case 'status':
      return sorted.sort((a, b) => a.status.localeCompare(b.status));
    
    case 'powerLoss':
      return sorted.sort((a, b) => {
        const lossA = a.powerReadings.length > 0 
          ? a.powerReadings[a.powerReadings.length - 1].loss 
          : 0;
        const lossB = b.powerReadings.length > 0 
          ? b.powerReadings[b.powerReadings.length - 1].loss 
          : 0;
        return lossB - lossA; // Descending (highest loss first)
      });
    
    case 'lastUpdate':
      return sorted.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    
    default:
      return sorted;
  }
}

/**
 * Display node in table format (for rendering)
 */
export function formatNodeForDisplay(node: Node): {
  id: string;
  type: string;
  coordinates: string;
  powerInOut: string;
  connectedNodes: number;
  status: string;
  lastUpdate: string;
} {
  const powerReading = node.powerReadings.length > 0 
    ? node.powerReadings[node.powerReadings.length - 1]
    : null;

  return {
    id: node.nodeId,
    type: node.type,
    coordinates: `${node.coordinates.latitude.toFixed(4)}, ${node.coordinates.longitude.toFixed(4)}`,
    powerInOut: powerReading 
      ? `${powerReading.powerIn?.toFixed(1) || 'N/A'} dBm → ${powerReading.powerOut?.toFixed(1) || 'N/A'} dBm`
      : 'No readings',
    connectedNodes: node.linkedNodes.length,
    status: node.status,
    lastUpdate: new Date(node.updatedAt).toLocaleDateString(),
  };
}

/**
 * Get nodes that need immediate attention
 */
export function getNodesNeedingAttention(nodes: Node[]): Node[] {
  return nodes.filter(node => {
    // Damaged nodes
    if (node.condition === 'damaged') return true;
    
    // Nodes needing service
    if (node.status === 'Needs Service') return true;
    
    // High power loss (> 20dB)
    if (node.powerReadings.length > 0) {
      const latestReading = node.powerReadings[node.powerReadings.length - 1];
      if (latestReading.loss > 20) return true;
    }
    
    // Hasn't been updated recently (> 30 days)
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(node.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 30) return true;
    
    return false;
  });
}

/**
 * Export node database (for backup/sync)
 */
export function exportNodeDatabase(nodes: Node[]): string {
  return JSON.stringify(nodes, null, 2);
}

/**
 * Import node database (for restore/sync)
 */
export async function importNodeDatabase(jsonData: string): Promise<void> {
  try {
    const importedNodes: Node[] = JSON.parse(jsonData);
    nodeDatabase = importedNodes;
  } catch (error) {
    console.error('Failed to import node database:', error);
    throw new Error('Invalid node database format');
  }
}
