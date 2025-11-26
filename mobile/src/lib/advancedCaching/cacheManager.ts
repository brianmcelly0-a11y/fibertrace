import { CacheEntry, CacheOptions, CacheStats } from './types';

class PersistentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  constructor(options?: CacheOptions) {
    this.maxSize = options?.maxSize || 100;
    this.defaultTtl = options?.ttl || 3600000; // 1 hour default
  }

  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      hits: 0,
    };

    this.cache.set(key, entry);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  getSize(): number {
    return this.cache.size;
  }
}

export function createCache<T>(options?: CacheOptions): PersistentCache<T> {
  return new PersistentCache<T>(options);
}

export const jobCache = createCache<any>({ ttl: 600000, maxSize: 50 }); // 10 min TTL
export const inventoryCache = createCache<any>({ ttl: 300000, maxSize: 100 }); // 5 min TTL
export const routeCache = createCache<any>({ ttl: 900000, maxSize: 50 }); // 15 min TTL
export const nodeCache = createCache<any>({ ttl: 600000, maxSize: 200 }); // 10 min TTL
