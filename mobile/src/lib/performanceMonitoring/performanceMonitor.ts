import { PerformanceMetric, PerformanceStats } from './types';

let metrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

export function recordMetric(name: string, duration: number, category: 'render' | 'network' | 'storage' | 'bluetooth'): void {
  const metric: PerformanceMetric = {
    name,
    duration,
    category,
    timestamp: new Date().toISOString(),
  };

  metrics.push(metric);

  // Keep only last MAX_METRICS to prevent memory bloat
  if (metrics.length > MAX_METRICS) {
    metrics = metrics.slice(-MAX_METRICS);
  }
}

export function measureOperation<T>(name: string, operation: () => T, category: 'render' | 'network' | 'storage' | 'bluetooth' = 'storage'): T {
  const start = Date.now();
  const result = operation();
  const duration = Date.now() - start;
  recordMetric(name, duration, category);
  return result;
}

export async function measureAsyncOperation<T>(name: string, operation: () => Promise<T>, category: 'render' | 'network' | 'storage' | 'bluetooth' = 'network'): Promise<T> {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;
  recordMetric(name, duration, category);
  return result;
}

export function getPerformanceStats(): PerformanceStats {
  const renderMetrics = metrics.filter(m => m.category === 'render');
  const networkMetrics = metrics.filter(m => m.category === 'network');

  const avgRender = renderMetrics.length > 0
    ? renderMetrics.reduce((acc, m) => acc + m.duration, 0) / renderMetrics.length
    : 0;

  const avgNetwork = networkMetrics.length > 0
    ? networkMetrics.reduce((acc, m) => acc + m.duration, 0) / networkMetrics.length
    : 0;

  return {
    averageRenderTime: avgRender,
    averageNetworkTime: avgNetwork,
    totalCacheHits: 0,
    totalCacheMisses: 0,
    cacheHitRate: 0,
  };
}

export function getMetrics(category?: string): PerformanceMetric[] {
  if (category) {
    return metrics.filter(m => m.category === category);
  }
  return [...metrics];
}

export function clearMetrics(): void {
  metrics = [];
}

export function logMetricsSummary(): void {
  const stats = getPerformanceStats();
  console.log('Performance Summary:', stats);
}
