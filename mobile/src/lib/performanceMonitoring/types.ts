export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  category: 'render' | 'network' | 'storage' | 'bluetooth';
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  size: number;
  hits: number;
  misses: number;
}

export interface PerformanceStats {
  averageRenderTime: number;
  averageNetworkTime: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  cacheHitRate: number;
}
