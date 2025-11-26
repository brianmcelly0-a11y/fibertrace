// Utility functions for mobile app

// Haversine distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total distance in path
export function calculateTotalDistance(path: [number, number][]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistance(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
  }
  return total;
}

// Get power status color
export function getPowerStatusColor(power?: string): {
  color: string;
  status: string;
} {
  const p = parseFloat(power || '0');
  
  if (p >= 0) {
    return { color: '#10b981', status: 'High' }; // Green
  } else if (p >= -10) {
    return { color: '#f59e0b', status: 'Medium' }; // Amber
  } else if (p >= -20) {
    return { color: '#f97316', status: 'Low' }; // Orange
  } else {
    return { color: '#ef4444', status: 'Critical' }; // Red
  }
}

// Format number
export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

// Format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return formatNumber(bytes / Math.pow(k, i)) + ' ' + sizes[i];
}
