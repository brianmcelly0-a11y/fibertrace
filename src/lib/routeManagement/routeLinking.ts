// Route-Node Linking Workflow

import { Route, Coordinates } from './types';

/**
 * Auto-link route to start and end nodes
 */
export function autoLinkRoute(
  route: Route,
  startNodeId: number,
  endNodeId: number,
  startNodeLabel: string,
  endNodeLabel: string,
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();

  route.startNodeId = startNodeId;
  route.endNodeId = endNodeId;
  route.startNodeLabel = startNodeLabel;
  route.endNodeLabel = endNodeLabel;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'node_linking',
    oldValue: null,
    newValue: `${startNodeLabel} → ${endNodeLabel}`,
    changedBy: technicianName,
    timestamp: now,
    reason: 'Auto-linked nodes',
  });

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Relink route start node
 */
export function relinkStartNode(
  route: Route,
  newStartNodeId: number,
  newStartNodeLabel: string,
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();
  const oldValue = `${route.startNodeLabel} (${route.startNodeId})`;

  route.startNodeId = newStartNodeId;
  route.startNodeLabel = newStartNodeLabel;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'start_node_relinked',
    oldValue,
    newValue: `${newStartNodeLabel} (${newStartNodeId})`,
    changedBy: technicianName,
    timestamp: now,
    reason: 'Start node relinked',
  });

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Relink route end node
 */
export function relinkEndNode(
  route: Route,
  newEndNodeId: number,
  newEndNodeLabel: string,
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();
  const oldValue = `${route.endNodeLabel} (${route.endNodeId})`;

  route.endNodeId = newEndNodeId;
  route.endNodeLabel = newEndNodeLabel;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'end_node_relinked',
    oldValue,
    newValue: `${newEndNodeLabel} (${newEndNodeId})`,
    changedBy: technicianName,
    timestamp: now,
    reason: 'End node relinked',
  });

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Split route at a new node
 * This creates two routes from one
 */
export function splitRoute(
  route: Route,
  splitPointIndex: number, // Index in coordinates array
  newNodeId: number,
  newNodeLabel: string,
  technicianName: string = 'Unknown'
): { route1: Route; route2: Route } {
  if (splitPointIndex <= 0 || splitPointIndex >= route.coordinates.length - 1) {
    throw new Error('Invalid split point');
  }

  const now = new Date();

  // Route 1: Original start to split point
  const route1: Route = {
    ...route,
    id: `route-${Date.now()}-1`,
    routeId: `${route.routeId}-A`,
    name: `${route.name} (Part A)`,
    endNodeId: newNodeId,
    endNodeLabel: newNodeLabel,
    coordinates: route.coordinates.slice(0, splitPointIndex + 1),
    segments: route.segments.slice(0, splitPointIndex),
    totalDistance: route.segments
      .slice(0, splitPointIndex)
      .reduce((sum, seg) => sum + seg.distance, 0),
    createdAt: now,
    updatedAt: now,
    lastUpdatedBy: technicianName,
    changeHistory: [{
      id: `ch-${Date.now()}`,
      fieldChanged: 'route_split',
      oldValue: route.routeId,
      newValue: `${route.routeId}-A`,
      changedBy: technicianName,
      timestamp: now,
      reason: `Route split at ${newNodeLabel}`,
    }],
    synced: false,
  };

  // Route 2: Split point to original end
  const route2: Route = {
    ...route,
    id: `route-${Date.now()}-2`,
    routeId: `${route.routeId}-B`,
    name: `${route.name} (Part B)`,
    startNodeId: newNodeId,
    startNodeLabel: newNodeLabel,
    coordinates: route.coordinates.slice(splitPointIndex),
    segments: route.segments.slice(splitPointIndex),
    totalDistance: route.segments
      .slice(splitPointIndex)
      .reduce((sum, seg) => sum + seg.distance, 0),
    createdAt: now,
    updatedAt: now,
    lastUpdatedBy: technicianName,
    changeHistory: [{
      id: `ch-${Date.now()}`,
      fieldChanged: 'route_split',
      oldValue: route.routeId,
      newValue: `${route.routeId}-B`,
      changedBy: technicianName,
      timestamp: now,
      reason: `Route split at ${newNodeLabel}`,
    }],
    synced: false,
  };

  return { route1, route2 };
}

/**
 * Get routes connecting two nodes
 */
export function getConnectedRoutes(
  routes: Route[],
  nodeId1: number,
  nodeId2: number
): Route[] {
  return routes.filter(route =>
    (route.startNodeId === nodeId1 && route.endNodeId === nodeId2) ||
    (route.startNodeId === nodeId2 && route.endNodeId === nodeId1)
  );
}

/**
 * Get all routes connected to a node
 */
export function getRoutesForNode(routes: Route[], nodeId: number): Route[] {
  return routes.filter(route =>
    route.startNodeId === nodeId || route.endNodeId === nodeId
  );
}

/**
 * Get network path from node A to node B through routes
 */
export function getNetworkPath(
  routes: Route[],
  startNodeId: number,
  endNodeId: number
): Route[] {
  const path: Route[] = [];
  const visited = new Set<number>();

  function findPath(currentNodeId: number): boolean {
    if (currentNodeId === endNodeId) {
      return true;
    }

    visited.add(currentNodeId);

    for (const route of routes) {
      if (route.startNodeId === currentNodeId && !visited.has(route.endNodeId)) {
        path.push(route);
        if (findPath(route.endNodeId)) {
          return true;
        }
        path.pop();
      } else if (route.endNodeId === currentNodeId && !visited.has(route.startNodeId)) {
        path.push(route);
        if (findPath(route.startNodeId)) {
          return true;
        }
        path.pop();
      }
    }

    return false;
  }

  findPath(startNodeId);
  return path;
}

/**
 * Validate route-node linking
 */
export function validateRouteLinking(route: Route): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (route.startNodeId === undefined) {
    errors.push('Start node not linked');
  }

  if (route.endNodeId === undefined) {
    errors.push('End node not linked');
  }

  if (route.startNodeId === route.endNodeId) {
    errors.push('Start and end nodes cannot be the same');
  }

  if (!route.coordinates || route.coordinates.length < 2) {
    errors.push('Route must have at least 2 coordinates');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
