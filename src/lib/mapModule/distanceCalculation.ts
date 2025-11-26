// Workflow 5: AUTO DISTANCE CALCULATION - Point-to-point and multi-node chains
import { GeoPoint, FiberLine, MapNode } from './types';

const EARTH_RADIUS_KM = 6371;

export function calculateHaversineDistance(point1: GeoPoint, point2: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLng = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function calculatePathDistance(points: GeoPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateHaversineDistance(points[i], points[i + 1]);
  }
  return total;
}

export function createFiberLineFromPoints(
  startNode: MapNode,
  endNode: MapNode,
  points: GeoPoint[] = []
): Omit<FiberLine, 'id'> {
  const straightDistance = calculateHaversineDistance(
    { latitude: startNode.latitude, longitude: startNode.longitude },
    { latitude: endNode.latitude, longitude: endNode.longitude }
  );

  let points_to_use = points;
  if (points.length === 0) {
    points_to_use = [
      { latitude: startNode.latitude, longitude: startNode.longitude },
      { latitude: endNode.latitude, longitude: endNode.longitude },
    ];
  }

  const routeDistance = calculatePathDistance(points_to_use);
  const slackPercentage = 10; // Default 10% slack
  const cableLength = routeDistance * (1 + slackPercentage / 100);

  return {
    startNodeId: startNode.id,
    endNodeId: endNode.id,
    straightDistance,
    routeDistance,
    cableLength,
    slackPercentage,
    points: points_to_use,
    type: startNode.category === 'Feeder' ? 'feeder' : 'distribution',
    createdAt: Date.now(),
    lastUpdate: Date.now(),
  };
}

export function calculateMultiNodeChain(
  nodes: MapNode[],
  fiberLines: FiberLine[]
): {
  totalDistance: number;
  segments: { from: string; to: string; distance: number }[];
  recommendedCableLength: number;
} {
  let totalDistance = 0;
  const segments: { from: string; to: string; distance: number }[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const start = nodes[i];
    const end = nodes[i + 1];

    const line = fiberLines.find(
      (l) => l.startNodeId === start.id && l.endNodeId === end.id
    );

    if (line) {
      totalDistance += line.routeDistance;
      segments.push({
        from: start.name,
        to: end.name,
        distance: line.routeDistance,
      });
    }
  }

  return {
    totalDistance,
    segments,
    recommendedCableLength: totalDistance * 1.1, // 10% slack
  };
}

export function recalculateLineWithSlack(line: FiberLine, newSlackPercent: number): FiberLine {
  return {
    ...line,
    slackPercentage: newSlackPercent,
    cableLength: line.routeDistance * (1 + newSlackPercent / 100),
    lastUpdate: Date.now(),
  };
}
