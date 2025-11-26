export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface TrackingSession {
  id: string;
  jobId: string;
  technicianId: string;
  startLocation: Location;
  currentLocation: Location;
  path: Location[];
  distance: number;
  startTime: string;
  endTime?: string;
  status: 'Active' | 'Paused' | 'Completed';
}

export interface RoutePoint {
  id: string;
  location: Location;
  type: 'Start' | 'End' | 'Waypoint' | 'CheckIn';
  description: string;
  timestamp: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: Location;
  radius: number;
  type: 'JobSite' | 'Warehouse' | 'Office';
}

export interface TrackingMetrics {
  totalDistance: number;
  averageSpeed: number;
  totalDuration: number;
  routeEfficiency: number;
  timeOnSite: number;
}
