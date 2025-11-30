// Performance optimization layer with caching

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 30000); // Cleanup every 30 seconds
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();

// Query optimization helpers
export const queryCache = {
  routes: (id?: number) => id ? `route:${id}` : 'routes:all',
  closures: (id?: number) => id ? `closure:${id}` : 'closures:all',
  nodes: (routeId?: number) => routeId ? `nodes:${routeId}` : 'nodes:all',
  mapData: 'map:data',
  user: (id: number) => `user:${id}`,
};

// Database query performance monitoring
export class QueryPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordQuery(query: string, timeMs: number): void {
    if (!this.metrics.has(query)) {
      this.metrics.set(query, []);
    }
    this.metrics.get(query)!.push(timeMs);
  }

  getStats(query: string): { avg: number; max: number; min: number; count: number } | null {
    const times = this.metrics.get(query);
    if (!times || times.length === 0) return null;

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      max: Math.max(...times),
      min: Math.min(...times),
      count: times.length
    };
  }

  getAllStats() {
    const result: Record<string, any> = {};
    for (const [query, times] of this.metrics.entries()) {
      if (times.length > 0) {
        result[query] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          max: Math.max(...times),
          min: Math.min(...times),
          count: times.length
        };
      }
    }
    return result;
  }
}

export const perfMonitor = new QueryPerformanceMonitor();
