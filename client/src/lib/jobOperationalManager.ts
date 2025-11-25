// Job Operational Management - Web Version
// Auto-calculations for cable needs, time estimates, and route optimization

export interface OperationalJobConfig {
  type: string;
  address: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  scheduledDate: Date;
  notes?: string;
  latitude?: string;
  longitude?: string;
  cableUsed?: string;
  materialsUsed?: string;
  selectedNodeIds?: number[];
  routeDistance?: number;
}

export interface OperationalMetrics {
  estimatedDistance: number;
  estimatedCable: number;
  estimatedTime: number;
  powerImpact: string;
  nodeCount: number;
}

// Estimate cable needed based on route distance (in kilometers)
export function estimateCableNeeded(distanceKm: number): number {
  // Add 15% buffer for actual fiber routing, splicing, slack
  return Math.ceil(distanceKm * 1000 * 1.15);
}

// Calculate route distance from waypoints (Haversine formula)
export function calculateRouteDistance(waypoints: [number, number][]): number {
  if (waypoints.length < 2) return 0;

  let distance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lon1] = waypoints[i];
    const [lat2, lon2] = waypoints[i + 1];
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance += R * c;
  }
  return distance;
}

// Estimate completion time based on distance and node count
export function estimateCompletionTime(distanceKm: number, nodeCount: number): number {
  // Base time: 30 minutes + 10 min per km + 5 min per node
  const baseTime = 30;
  const distanceTime = Math.ceil(distanceKm * 10);
  const nodeTime = nodeCount * 5;
  return baseTime + distanceTime + nodeTime;
}

// Analyze power impact based on node count
export function analyzePowerImpact(nodeCount: number): string {
  if (nodeCount === 0) return 'No nodes selected';
  if (nodeCount < 3) return 'Low - Few nodes';
  if (nodeCount < 6) return 'Medium - Multiple nodes';
  return 'High - Complex route';
}

// Calculate all operational metrics
export function calculateOperationalMetrics(
  distanceKm: number,
  nodeCount: number
): OperationalMetrics {
  const estimatedCable = estimateCableNeeded(distanceKm);
  const estimatedTime = estimateCompletionTime(distanceKm, nodeCount);
  const powerImpact = analyzePowerImpact(nodeCount);

  return {
    estimatedDistance: distanceKm,
    estimatedCable,
    estimatedTime,
    powerImpact,
    nodeCount,
  };
}

// Format metrics for display
export function formatMetricsForDisplay(metrics: OperationalMetrics): {
  distance: string;
  cable: string;
  time: string;
  impact: string;
} {
  return {
    distance: `${metrics.estimatedDistance.toFixed(2)} km`,
    cable: `${metrics.estimatedCable} m`,
    time: `${metrics.estimatedTime} min`,
    impact: metrics.powerImpact,
  };
}

// Create job summary for preview
export function createJobSummary(metrics: OperationalMetrics): string {
  return `Route: ${metrics.estimatedDistance.toFixed(2)} km | Cable: ${metrics.estimatedCable}m | Time: ${metrics.estimatedTime}min | Nodes: ${metrics.nodeCount}`;
}
