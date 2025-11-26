// Route Distance Management Workflow

import { Coordinates, RouteSegment, DistanceSegment, Route } from './types';

const EARTH_RADIUS_METERS = 6371000; // meters

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate total distance of a route
 */
export function calculateTotalRouteDistance(route: Route): number {
  return route.segments.reduce((sum, segment) => sum + segment.distance, 0);
}

/**
 * Get all segments as detailed distance info
 */
export function getSegmentDistances(route: Route): DistanceSegment[] {
  return route.segments.map(segment => ({
    from: segment.startCoords,
    to: segment.endCoords,
    distance: segment.distance,
    bearing: calculateBearing(segment.startCoords, segment.endCoords),
  }));
}

/**
 * Compare expected vs actual distance
 */
export function compareDistances(route: Route): {
  expected: number;
  actual: number;
  difference: number;
  differencePercentage: number;
} {
  const actual = calculateTotalRouteDistance(route);
  const expected = route.expectedDistance || actual;
  const difference = actual - expected;
  const differencePercentage = expected > 0 ? (difference / expected) * 100 : 0;

  return {
    expected,
    actual,
    difference,
    differencePercentage,
  };
}

/**
 * Override route distance (for manual correction)
 */
export function overrideRouteDistance(
  route: Route,
  newDistance: number,
  reason: string,
  technicianName: string
): Route {
  const now = new Date();

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'totalDistance',
    oldValue: route.totalDistance,
    newValue: newDistance,
    changedBy: technicianName,
    timestamp: now,
    reason,
  });

  route.totalDistance = newDistance;
  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Add reserve cable length (slack, coils, etc.)
 */
export function addReserveLength(
  route: Route,
  reserveLength: number,
  reason: string,
  technicianName: string
): Route {
  if (reserveLength < 0) {
    throw new Error('Reserve length must be positive');
  }

  const now = new Date();
  const oldReserve = route.inventory.reserve;

  route.inventory.reserve = reserveLength;
  route.inventory.totalLength = route.totalDistance + reserveLength;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'reserve_length',
    oldValue: oldReserve,
    newValue: reserveLength,
    changedBy: technicianName,
    timestamp: now,
    reason,
  });

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Get cable metrics for route
 */
export function getCableMetrics(route: Route): {
  cableType: string;
  cableSize: string;
  routeDistance: number;
  totalCableLength: number;
  reserve: number;
  costEstimate: number; // Rough estimate based on cable type
} {
  // Very rough cost estimates per meter
  const costPerMeter: Record<string, number> = {
    'ADSS': 0.15,
    'G652D': 0.10,
    'G657A': 0.12,
    'G657B': 0.11,
    'Armored': 0.20,
    'Aerial': 0.14,
    'Underground': 0.18,
    'Submarine': 0.50,
  };

  const unitCost = costPerMeter[route.inventory.cableType] || 0.12;
  const costEstimate = route.inventory.totalLength * unitCost;

  return {
    cableType: route.inventory.cableType,
    cableSize: route.inventory.cableSize,
    routeDistance: route.totalDistance,
    totalCableLength: route.inventory.totalLength,
    reserve: route.inventory.reserve,
    costEstimate,
  };
}

/**
 * Calculate splice locations along route
 */
export function getSpliceLocations(route: Route): Array<{
  segmentIndex: number;
  distanceFromStart: number;
  coordinates: Coordinates;
}> {
  const spliceLocations: Array<{
    segmentIndex: number;
    distanceFromStart: number;
    coordinates: Coordinates;
  }> = [];

  let distanceFromStart = 0;

  route.segments.forEach((segment, idx) => {
    distanceFromStart += segment.distance;
    spliceLocations.push({
      segmentIndex: idx,
      distanceFromStart,
      coordinates: segment.endCoords,
    });
  });

  return spliceLocations;
}

/**
 * Estimate material requirements
 */
export function estimateMaterials(route: Route): {
  cable: number; // meters
  spliceProtectors: number;
  heatShrink: number;
  closures: number;
  miscConnectors: number;
} {
  const totalLength = route.inventory.totalLength;
  const segmentCount = route.segments.length;

  return {
    cable: Math.ceil(totalLength),
    spliceProtectors: segmentCount + 2, // One per splice + 2 for terminations
    heatShrink: (segmentCount + 2) * 3, // 3 per splice
    closures: Math.ceil(segmentCount / 4), // One closure per 4 segments
    miscConnectors: 4, // Standard set for terminations
  };
}

/**
 * Helper: Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Helper: Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
