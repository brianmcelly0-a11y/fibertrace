// Phase 3: Job Management Utilities
import type { FiberRoute } from "@shared/schema";

export interface JobCreationData {
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
  selectedNodeIds: string[];
}

export interface JobWithRoutes {
  id: number;
  type: string;
  address: string;
  status: string;
  latitude: string;
  longitude: string;
  notes: string | null;
  routes?: FiberRoute[];
}

export function createJobFromNodes(
  nodeIds: string[],
  waypoints: [number, number][],
  jobType: string,
  address: string,
  notes?: string
) {
  return {
    type: jobType,
    address,
    latitude: waypoints[0]?.[0] ?? 0,
    longitude: waypoints[0]?.[1] ?? 0,
    notes: notes || `Job linking ${nodeIds.length} nodes with ${waypoints.length} waypoints`,
    selectedNodeIds: nodeIds,
  };
}

export function formatJobStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    'Pending': { label: 'Pending', color: 'text-yellow-500' },
    'In Progress': { label: 'In Progress', color: 'text-blue-500' },
    'Completed': { label: 'Completed', color: 'text-green-500' },
    'On Hold': { label: 'On Hold', color: 'text-orange-500' },
    'Cancelled': { label: 'Cancelled', color: 'text-red-500' },
  };
  return statusMap[status] || { label: status, color: 'text-gray-500' };
}

export function calculateJobDistance(waypoints: [number, number][]): number {
  if (waypoints.length < 2) return 0;
  
  let distance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lon1] = waypoints[i];
    const [lat2, lon2] = waypoints[i + 1];
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance += R * c;
  }
  return distance;
}
