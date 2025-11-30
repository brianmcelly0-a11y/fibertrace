// Offline map tile caching system
import AsyncStorage from '@react-native-async-storage/async-storage';

const TILE_CACHE_KEY = 'map_tiles_cache';
const TILE_INDEX_KEY = 'map_tiles_index';

export interface CachedTile {
  z: number; // zoom level
  x: number; // tile x coordinate
  y: number; // tile y coordinate
  imageBase64: string;
  timestamp: number;
}

export interface TileIndex {
  zoom: number;
  region: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  tileCount: number;
  cachedAt: number;
  expiresAt: number;
}

// Cache tiles for a specific region at given zoom level
export async function cacheRegionTiles(
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  zoomLevels: number[] = [14, 15, 16]
): Promise<void> {
  try {
    const index: TileIndex = {
      zoom: zoomLevels[0],
      region: {
        minLat: region.latitude - region.latitudeDelta / 2,
        maxLat: region.latitude + region.latitudeDelta / 2,
        minLon: region.longitude - region.longitudeDelta / 2,
        maxLon: region.longitude + region.longitudeDelta / 2,
      },
      tileCount: 0,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    await AsyncStorage.setItem(TILE_INDEX_KEY, JSON.stringify(index));
    console.log('📍 Map region indexed for offline use (tiles will download when online)');
  } catch (error) {
    console.error('Error caching region tiles:', error);
  }
}

// Get cached tile if available
export async function getCachedTile(z: number, x: number, y: number): Promise<string | null> {
  try {
    const key = `tile_${z}_${x}_${y}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (cached) {
      const tile: CachedTile = JSON.parse(cached);
      // Check if tile is still valid (7 days)
      if (Date.now() - tile.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return tile.imageBase64;
      } else {
        // Remove expired tile
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error getting cached tile:', error);
  }
  return null;
}

// Cache a single tile
export async function cacheTile(
  z: number,
  x: number,
  y: number,
  imageBase64: string
): Promise<void> {
  try {
    const key = `tile_${z}_${x}_${y}`;
    const tile: CachedTile = {
      z,
      x,
      y,
      imageBase64,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(tile));
  } catch (error) {
    console.error('Error caching tile:', error);
  }
}

// Clear old tiles
export async function clearExpiredTiles(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tileKeys = keys.filter(k => k.startsWith('tile_'));
    
    for (const key of tileKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const tile: CachedTile = JSON.parse(cached);
        // Remove if older than 7 days
        if (Date.now() - tile.timestamp > 7 * 24 * 60 * 60 * 1000) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing expired tiles:', error);
  }
}

// Get tile cache status
export async function getTileCacheStatus(): Promise<{
  cached: boolean;
  region: any;
  tileCount: number;
  size: string;
}> {
  try {
    const index = await AsyncStorage.getItem(TILE_INDEX_KEY);
    
    if (!index) {
      return {
        cached: false,
        region: null,
        tileCount: 0,
        size: '0 MB',
      };
    }

    const indexData: TileIndex = JSON.parse(index);
    
    // Estimate cache size (rough calculation)
    const estimatedSizeMB = (indexData.tileCount * 25) / 1024; // ~25KB per tile
    
    return {
      cached: true,
      region: indexData.region,
      tileCount: indexData.tileCount,
      size: estimatedSizeMB.toFixed(2) + ' MB',
    };
  } catch (error) {
    console.error('Error getting tile cache status:', error);
    return {
      cached: false,
      region: null,
      tileCount: 0,
      size: '0 MB',
    };
  }
}

// Pre-download tiles for offline use (call when on WiFi)
export async function predownloadTilesForRegion(
  region: any,
  zoomLevels: number[] = [14, 15]
): Promise<number> {
  let downloaded = 0;
  
  try {
    for (const z of zoomLevels) {
      const tiles = getTilesForRegion(region, z);
      
      for (const tile of tiles) {
        try {
          // URL format for OpenStreetMap/Google Maps tiles
          const tileUrl = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
          
          const response = await fetch(tileUrl);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            
            await new Promise((resolve) => {
              reader.onloadend = async () => {
                const base64 = reader.result as string;
                await cacheTile(tile.z, tile.x, tile.y, base64);
                downloaded++;
                resolve(null);
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.warn(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}`);
        }
      }
    }

    await cacheRegionTiles(region, zoomLevels);
  } catch (error) {
    console.error('Error predownloading tiles:', error);
  }
  
  return downloaded;
}

// Calculate tiles needed for a region
function getTilesForRegion(
  region: any,
  z: number
): Array<{ z: number; x: number; y: number }> {
  const tiles: Array<{ z: number; x: number; y: number }> = [];
  
  // Convert lat/lon to tile coordinates
  const minTile = latLonToTile(
    region.latitude - region.latitudeDelta / 2,
    region.longitude - region.longitudeDelta / 2,
    z
  );
  
  const maxTile = latLonToTile(
    region.latitude + region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    z
  );

  for (let x = Math.floor(minTile.x); x <= Math.ceil(maxTile.x); x++) {
    for (let y = Math.floor(minTile.y); y <= Math.ceil(maxTile.y); y++) {
      tiles.push({ z, x, y });
    }
  }

  return tiles;
}

// Helper: Convert lat/lon to tile coordinates
function latLonToTile(lat: number, lon: number, z: number) {
  const n = Math.pow(2, z);
  const x = n * ((lon + 180) / 360);
  const y = n * ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2);
  return { x, y };
}
