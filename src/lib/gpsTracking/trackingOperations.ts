import { Location, TrackingSession, RoutePoint, TrackingMetrics } from './types';

// Haversine formula for distance calculation
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
}

export function startTracking(jobId: string, technicianId: string, startLocation: Location): TrackingSession {
  return {
    id: `track-${Date.now()}`,
    jobId,
    technicianId,
    startLocation,
    currentLocation: startLocation,
    path: [startLocation],
    distance: 0,
    startTime: new Date().toISOString(),
    status: 'Active',
  };
}

export function updateLocation(session: TrackingSession, newLocation: Location): TrackingSession {
  const newDistance = calculateDistance(session.currentLocation, newLocation);
  return {
    ...session,
    currentLocation: newLocation,
    path: [...session.path, newLocation],
    distance: session.distance + newDistance,
  };
}

export function completeTracking(session: TrackingSession): TrackingSession {
  return {
    ...session,
    status: 'Completed',
    endTime: new Date().toISOString(),
  };
}

export function calculateTrackingMetrics(session: TrackingSession): TrackingMetrics {
  const duration = session.endTime
    ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
    : Date.now() - new Date(session.startTime).getTime();

  const durationHours = duration / (1000 * 60 * 60);
  const avgSpeed = durationHours > 0 ? (session.distance / 1000) / durationHours : 0;

  return {
    totalDistance: session.distance,
    averageSpeed: avgSpeed,
    totalDuration: duration,
    routeEfficiency: Math.min(100, (session.distance / (session.path.length * 100)) * 100),
    timeOnSite: 0,
  };
}

export function getRoutePath(session: TrackingSession): RoutePoint[] {
  return session.path.map((loc, idx) => ({
    id: `point-${idx}`,
    location: loc,
    type: idx === 0 ? 'Start' : idx === session.path.length - 1 ? 'End' : 'Waypoint',
    description: `Point ${idx + 1}`,
    timestamp: loc.timestamp,
  }));
}

export function getNearbyPoints(center: Location, points: RoutePoint[], radiusKm: number): RoutePoint[] {
  return points.filter(point => {
    const distance = calculateDistance(center, point.location) / 1000;
    return distance <= radiusKm;
  });
}
