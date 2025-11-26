// Route Loading & Visualization Workflow

import { Route, RouteType, RouteStats, RouteFilter, RouteAttachment } from './types';

let routeDatabase: Route[] = [];

/**
 * Load all fiber routes from storage
 */
export async function loadRouteDatabase(): Promise<Route[]> {
  try {
    // In production, load from AsyncStorage or SQLite
    return routeDatabase;
  } catch (error) {
    console.error('Failed to load route database:', error);
    return [];
  }
}

/**
 * Get route color based on type
 */
export function getRouteColor(type: RouteType): string {
  const colorMap: Record<RouteType, string> = {
    'Backbone': '#0066FF',    // Blue
    'Distribution': '#FFCC00', // Yellow
    'Access': '#00CC44',       // Green
    'Drop': '#FFFFFF',         // White
  };
  return colorMap[type];
}

/**
 * Get color for route status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Completed':
      return '#00CC44'; // Green
    case 'Under Construction':
      return '#FFCC00'; // Yellow
    case 'Faulty':
      return '#FF0000'; // Red
    case 'Pending Survey':
      return '#FF9900'; // Orange
    default:
      return '#CCCCCC'; // Gray
  }
}

/**
 * Display route on map with color coding
 */
export function formatRouteForMap(route: Route): {
  routeId: string;
  name: string;
  type: string;
  coordinates: Array<[number, number]>;
  color: string;
  hasFaults: boolean;
  distance: string;
} {
  return {
    routeId: route.id,
    name: route.name,
    type: route.type,
    coordinates: route.coordinates.map(c => [c.latitude, c.longitude]),
    color: route.faults.some(f => !f.resolved) ? '#FF0000' : route.color,
    hasFaults: route.faults.some(f => !f.resolved),
    distance: `${(route.totalDistance / 1000).toFixed(2)} km`,
  };
}

/**
 * Classify routes by type
 */
export function classifyRoutesByType(routes: Route[]): Record<RouteType, Route[]> {
  const classified: Record<RouteType, Route[]> = {
    'Backbone': [],
    'Distribution': [],
    'Access': [],
    'Drop': [],
  };

  routes.forEach(route => {
    if (classified[route.type]) {
      classified[route.type].push(route);
    }
  });

  return classified;
}

/**
 * Get route statistics
 */
export function getRouteStats(routes: Route[]): RouteStats {
  const byType: Record<RouteType, number> = {
    'Backbone': 0,
    'Distribution': 0,
    'Access': 0,
    'Drop': 0,
  };

  const byStatus = {
    'Completed': 0,
    'Under Construction': 0,
    'Faulty': 0,
    'Pending Survey': 0,
    'Archived': 0,
  };

  let totalDistance = 0;
  let totalCableLength = 0;
  let activeRoutes = 0;
  let routesWithFaults = 0;
  let unsyncedCount = 0;

  routes.forEach(route => {
    byType[route.type]++;
    byStatus[route.status]++;
    totalDistance += route.totalDistance;
    totalCableLength += route.inventory.totalLength;

    if (route.status !== 'Archived') activeRoutes++;
    if (route.faults.some(f => !f.resolved)) routesWithFaults++;
    if (!route.synced) unsyncedCount++;
  });

  return {
    totalRoutes: routes.length,
    byType,
    byStatus,
    totalDistance,
    totalCableLength,
    activeRoutes,
    routesWithFaults,
    avgDistancePerRoute: routes.length > 0 ? totalDistance / routes.length : 0,
    unsyncedCount,
  };
}

/**
 * Filter routes by criteria
 */
export function filterRoutes(routes: Route[], filter: RouteFilter): Route[] {
  return routes.filter(route => {
    if (filter.type && route.type !== filter.type) return false;
    if (filter.status && route.status !== filter.status) return false;

    if (filter.hasActiveFaults !== undefined) {
      const hasFaults = route.faults.some(f => !f.resolved);
      if (filter.hasActiveFaults && !hasFaults) return false;
      if (!filter.hasActiveFaults && hasFaults) return false;
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      if (!route.name.toLowerCase().includes(term) &&
        !route.routeId.toLowerCase().includes(term)) {
        return false;
      }
    }

    if (filter.nodeId && !route.coordinates.some(c => c.latitude)) {
      if (route.startNodeId !== filter.nodeId && route.endNodeId !== filter.nodeId) {
        return false;
      }
    }

    if (filter.dateRange) {
      const createdDate = new Date(route.createdAt);
      if (createdDate < filter.dateRange.from || createdDate > filter.dateRange.to) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Search routes by term
 */
export function searchRoutes(routes: Route[], searchTerm: string): Route[] {
  const term = searchTerm.toLowerCase();
  return routes.filter(route =>
    route.name.toLowerCase().includes(term) ||
    route.routeId.toLowerCase().includes(term) ||
    route.startNodeLabel?.toLowerCase().includes(term) ||
    route.endNodeLabel?.toLowerCase().includes(term)
  );
}

/**
 * Sort routes by criteria
 */
export function sortRoutes(
  routes: Route[],
  sortBy: 'name' | 'type' | 'status' | 'distance' | 'lastUpdate'
): Route[] {
  const sorted = [...routes];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));

    case 'status':
      return sorted.sort((a, b) => a.status.localeCompare(b.status));

    case 'distance':
      return sorted.sort((a, b) => b.totalDistance - a.totalDistance);

    case 'lastUpdate':
      return sorted.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    default:
      return sorted;
  }
}

/**
 * Get routes with active faults
 */
export function getRoutesByFaultStatus(routes: Route[]): {
  activeFaults: Route[];
  resolved: Route[];
  noFaults: Route[];
} {
  const activeFaults: Route[] = [];
  const resolved: Route[] = [];
  const noFaults: Route[] = [];

  routes.forEach(route => {
    const hasActiveFaults = route.faults.some(f => !f.resolved);
    const hasResolvedFaults = route.faults.some(f => f.resolved);

    if (hasActiveFaults) {
      activeFaults.push(route);
    } else if (hasResolvedFaults) {
      resolved.push(route);
    } else {
      noFaults.push(route);
    }
  });

  return { activeFaults, resolved, noFaults };
}

/**
 * Get routes connected to node
 */
export function getRoutesForNode(routes: Route[], nodeId: number): Route[] {
  return routes.filter(route =>
    route.startNodeId === nodeId || route.endNodeId === nodeId
  );
}

/**
 * Export route database
 */
export function exportRouteDatabase(routes: Route[]): string {
  return JSON.stringify(routes, null, 2);
}

/**
 * Import route database
 */
export async function importRouteDatabase(jsonData: string): Promise<void> {
  try {
    const importedRoutes: Route[] = JSON.parse(jsonData);
    routeDatabase = importedRoutes;
  } catch (error) {
    console.error('Failed to import route database:', error);
    throw new Error('Invalid route database format');
  }
}
