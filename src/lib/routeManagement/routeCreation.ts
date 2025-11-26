// Route Creation Workflow (GPS Auto-Draw & Manual Map Draw)

import { Route, RouteCreationInput, GPSPath, Coordinates, RouteSegment } from './types';
import { calculateDistance } from './routeDistance';

/**
 * Create route from GPS path (auto-draw)
 */
export function createRouteFromGPSPath(
  input: RouteCreationInput,
  gpsPath: GPSPath,
  technicianName: string
): Route {
  // Validate path
  if (gpsPath.points.length < 2) {
    throw new Error('GPS path must have at least 2 points');
  }

  // Create segments from GPS path
  const segments: RouteSegment[] = [];
  let totalDistance = 0;

  for (let i = 0; i < gpsPath.points.length - 1; i++) {
    const distance = calculateDistance(gpsPath.points[i], gpsPath.points[i + 1]);
    totalDistance += distance;

    segments.push({
      id: `seg-${Date.now()}-${i}`,
      startCoords: gpsPath.points[i],
      endCoords: gpsPath.points[i + 1],
      distance,
      order: i,
      status: 'normal',
    });
  }

  const now = new Date();
  const route: Route = {
    id: `route-${Date.now()}`,
    routeId: input.routeId,
    name: input.name,
    type: input.type,
    status: 'Completed',

    startNodeId: input.startNodeId,
    endNodeId: input.endNodeId,

    segments,
    totalDistance,
    expectedDistance: input.expectedDistance || totalDistance,
    coordinates: gpsPath.points,
    color: getRouteColor(input.type),

    inventory: input.inventory,
    depth: input.depth,

    faults: [],

    createdBy: technicianName,
    createdAt: now,
    updatedAt: now,
    lastUpdatedBy: technicianName,
    changeHistory: [{
      id: `ch-${Date.now()}`,
      fieldChanged: 'route_created_gps',
      oldValue: null,
      newValue: input.routeId,
      changedBy: technicianName,
      timestamp: now,
      reason: `Created from GPS path (${gpsPath.points.length} points)`,
    }],

    attachments: input.attachmentUrls?.map((url, idx) => ({
      id: `attach-${idx}`,
      type: 'photo',
      url,
      timestamp: now,
    })) || [],

    notes: input.notes,
    synced: false,
  };

  return route;
}

/**
 * Create route from manual map points
 */
export function createRouteFromMapPoints(
  input: RouteCreationInput,
  mapPoints: Coordinates[],
  technicianName: string
): Route {
  // Validate points
  if (mapPoints.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  // Create segments from map points
  const segments: RouteSegment[] = [];
  let totalDistance = 0;

  for (let i = 0; i < mapPoints.length - 1; i++) {
    const distance = calculateDistance(mapPoints[i], mapPoints[i + 1]);
    totalDistance += distance;

    segments.push({
      id: `seg-${Date.now()}-${i}`,
      startCoords: mapPoints[i],
      endCoords: mapPoints[i + 1],
      distance,
      order: i,
      status: 'normal',
    });
  }

  const now = new Date();
  const route: Route = {
    id: `route-${Date.now()}`,
    routeId: input.routeId,
    name: input.name,
    type: input.type,
    status: 'Pending Survey',

    startNodeId: input.startNodeId,
    endNodeId: input.endNodeId,

    segments,
    totalDistance,
    expectedDistance: input.expectedDistance || totalDistance,
    coordinates: mapPoints,
    color: getRouteColor(input.type),

    inventory: input.inventory,
    depth: input.depth,

    faults: [],

    createdBy: technicianName,
    createdAt: now,
    updatedAt: now,
    lastUpdatedBy: technicianName,
    changeHistory: [{
      id: `ch-${Date.now()}`,
      fieldChanged: 'route_created_manual',
      oldValue: null,
      newValue: input.routeId,
      changedBy: technicianName,
      timestamp: now,
      reason: `Created from manual map points (${mapPoints.length} points)`,
    }],

    attachments: input.attachmentUrls?.map((url, idx) => ({
      id: `attach-${idx}`,
      type: 'photo',
      url,
      timestamp: now,
    })) || [],

    notes: input.notes,
    synced: false,
  };

  return route;
}

/**
 * Suggest next route ID
 */
export function suggestNextRouteId(existingRoutes: Route[]): string {
  const routeNumbers = existingRoutes.map(r => {
    const match = r.routeId.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  });

  const nextNum = (Math.max(...routeNumbers, 0) + 1).toString().padStart(3, '0');
  return `ROUTE-${nextNum}`;
}

/**
 * Validate route data
 */
export function validateRoute(route: Route): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!route.name || route.name.trim() === '') {
    errors.push('Route name is required');
  }

  if (!route.routeId || route.routeId.trim() === '') {
    errors.push('Route ID is required');
  }

  if (route.segments.length < 1) {
    errors.push('Route must have at least 1 segment');
  }

  if (route.startNodeId === undefined) {
    errors.push('Start node is required');
  }

  if (route.endNodeId === undefined) {
    errors.push('End node is required');
  }

  if (!route.inventory.cableType) {
    errors.push('Cable type is required');
  }

  if (!route.inventory.cableSize) {
    errors.push('Cable size is required');
  }

  if (route.totalDistance <= 0) {
    errors.push('Invalid route distance');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Add photos to route
 */
export function addRoutePhotos(route: Route, photoUrls: string[]): void {
  photoUrls.forEach((url, idx) => {
    route.attachments.push({
      id: `attach-${Date.now()}-${idx}`,
      type: 'photo',
      url,
      caption: `Route photo ${route.attachments.length + 1}`,
      timestamp: new Date(),
    });
  });
}

/**
 * Helper function to get route color
 */
function getRouteColor(type: string): string {
  const colorMap: Record<string, string> = {
    'Backbone': '#0066FF',
    'Distribution': '#FFCC00',
    'Access': '#00CC44',
    'Drop': '#FFFFFF',
  };
  return colorMap[type] || '#CCCCCC';
}
