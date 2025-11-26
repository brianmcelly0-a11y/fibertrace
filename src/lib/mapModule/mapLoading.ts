// Workflow 1: MAP LOADING - Initialize map with GPS/cache/saved coords
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoPoint, MapRegion } from './types';

const LAST_LOCATION_KEY = 'map_last_location';
const MAP_CACHE_KEY = 'map_tiles_cache';

export async function loadMapInitialState(): Promise<MapRegion> {
  try {
    // Priority 1: Try user's GPS location
    const gpsLocation = await getGPSLocation();
    if (gpsLocation) {
      return gpsLocationToRegion(gpsLocation);
    }

    // Priority 2: Last viewed coordinates
    const lastLocation = await getLastMapLocation();
    if (lastLocation) {
      return lastLocation;
    }

    // Priority 3: Default project area
    return getDefaultProjectArea();
  } catch (error) {
    console.error('Error loading map initial state:', error);
    return getDefaultProjectArea();
  }
}

async function getGPSLocation(): Promise<GeoPoint | null> {
  try {
    const location = await new Promise<GeoPoint | null>((resolve) => {
      // In real app, use expo-location
      // For now, return null to use fallback
      resolve(null);
    });
    return location;
  } catch (error) {
    console.error('GPS location error:', error);
    return null;
  }
}

function gpsLocationToRegion(location: GeoPoint): MapRegion {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}

async function getLastMapLocation(): Promise<MapRegion | null> {
  try {
    const stored = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving last location:', error);
  }
  return null;
}

function getDefaultProjectArea(): MapRegion {
  return {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}

export async function saveMapLocation(region: MapRegion): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(region));
  } catch (error) {
    console.error('Error saving map location:', error);
  }
}

export async function checkOfflineMapCache(): Promise<boolean> {
  try {
    const cache = await AsyncStorage.getItem(MAP_CACHE_KEY);
    return !!cache;
  } catch (error) {
    console.error('Error checking map cache:', error);
    return false;
  }
}

export async function checkGPSStatus(): Promise<boolean> {
  try {
    const location = await getGPSLocation();
    return !!location;
  } catch (error) {
    return false;
  }
}
