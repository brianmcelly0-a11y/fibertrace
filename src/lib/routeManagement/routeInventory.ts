// Route Inventory Tracking Workflow

import { Route } from './types';

/**
 * Get cable usage for route
 */
export function getCableUsage(route: Route): {
  cableType: string;
  cableSize: string;
  routeDistance: number;
  reserve: number;
  totalLength: number;
} {
  return {
    cableType: route.inventory.cableType,
    cableSize: route.inventory.cableSize,
    routeDistance: route.totalDistance,
    reserve: route.inventory.reserve,
    totalLength: route.inventory.totalLength,
  };
}

/**
 * Update cable inventory for route
 */
export function updateCableInventory(
  route: Route,
  newCableSize: string,
  newTotalLength: number,
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();
  const oldSize = route.inventory.cableSize;
  const oldLength = route.inventory.totalLength;

  route.inventory.cableSize = newCableSize;
  route.inventory.totalLength = newTotalLength;
  route.inventory.reserve = newTotalLength - route.totalDistance;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'cable_inventory',
    oldValue: `${oldSize} / ${oldLength}m`,
    newValue: `${newCableSize} / ${newTotalLength}m`,
    changedBy: technicianName,
    timestamp: now,
    reason: 'Cable inventory updated',
  });

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Get materials needed for route
 */
export function getMaterialsForRoute(route: Route): {
  cable: {
    type: string;
    size: string;
    length: number;
  };
  splices: number;
  closures: number;
  connectors: number;
  spliceProtectors: number;
  heatShrink: number;
} {
  const segmentCount = route.segments.length;

  return {
    cable: {
      type: route.inventory.cableType,
      size: route.inventory.cableSize,
      length: route.inventory.totalLength,
    },
    splices: route.inventory.spliceCount,
    closures: Math.ceil(segmentCount / 5), // One closure per 5 segments
    connectors: 4, // Standard termination set
    spliceProtectors: route.inventory.spliceCount + 2,
    heatShrink: (route.inventory.spliceCount + 2) * 3,
  };
}

/**
 * Estimate total cost for route
 */
export function estimateRouteCost(route: Route): {
  cableCost: number;
  materialsCost: number;
  laborCost: number;
  totalEstimate: number;
} {
  // Cost estimates (very rough, for planning only)
  const cableCostPerMeter: Record<string, number> = {
    'ADSS': 0.15,
    'G652D': 0.10,
    'G657A': 0.12,
    'G657B': 0.11,
    'Armored': 0.20,
    'Aerial': 0.14,
    'Underground': 0.18,
    'Submarine': 0.50,
  };

  const materials = getMaterialsForRoute(route);
  const unitCableCost = cableCostPerMeter[route.inventory.cableType] || 0.12;

  const cableCost = route.inventory.totalLength * unitCableCost;
  
  // Materials cost estimate
  const materialsCost = 
    materials.closures * 50 +
    materials.connectors * 15 +
    materials.spliceProtectors * 3 +
    materials.heatShrink * 0.50;

  // Labor cost estimate (rough: $50/hour, ~100m per hour)
  const laborCost = (route.totalDistance / 100) * 50;

  return {
    cableCost,
    materialsCost,
    laborCost,
    totalEstimate: cableCost + materialsCost + laborCost,
  };
}

/**
 * Generate inventory report for multiple routes
 */
export function generateInventoryReport(routes: Route[]): {
  totalCableByType: Record<string, number>;
  totalCableByCableSize: Record<string, number>;
  totalSplices: number;
  totalClosures: number;
  totalLength: number;
  costEstimate: number;
} {
  const totalCableByType: Record<string, number> = {};
  const totalCableByCableSize: Record<string, number> = {};
  let totalSplices = 0;
  let totalClosures = 0;
  let totalLength = 0;
  let costEstimate = 0;

  routes.forEach(route => {
    // Cable by type
    totalCableByType[route.inventory.cableType] = 
      (totalCableByType[route.inventory.cableType] || 0) + route.inventory.totalLength;

    // Cable by size
    totalCableByCableSize[route.inventory.cableSize] = 
      (totalCableByCableSize[route.inventory.cableSize] || 0) + route.inventory.totalLength;

    // Totals
    totalSplices += route.inventory.spliceCount;
    totalClosures += Math.ceil(route.segments.length / 5);
    totalLength += route.inventory.totalLength;

    // Cost
    const cost = estimateRouteCost(route);
    costEstimate += cost.totalEstimate;
  });

  return {
    totalCableByType,
    totalCableByCableSize,
    totalSplices,
    totalClosures,
    totalLength,
    costEstimate,
  };
}

/**
 * Track splice usage along route
 */
export function getSpliceInfo(route: Route): {
  totalSplices: number;
  splicesPerSegment: number[];
  spliceLocations: Array<{ segmentIndex: number; distanceFromStart: number }>;
} {
  const splicesPerSegment = route.segments.map(() => 1); // One splice per segment
  const spliceLocations = route.segments.map((segment, idx) => {
    const distanceFromStart = route.segments
      .slice(0, idx + 1)
      .reduce((sum, s) => sum + s.distance, 0);

    return {
      segmentIndex: idx,
      distanceFromStart,
    };
  });

  return {
    totalSplices: route.inventory.spliceCount,
    splicesPerSegment,
    spliceLocations,
  };
}
