import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as Perf from '@/lib/performanceMonitoring';
import { jobCache, inventoryCache, routeCache, nodeCache } from '@/lib/advancedCaching';

export default function PerformanceScreen() {
  const [perfStats, setPerfStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate some mock metrics
      Perf.recordMetric('screen_render', Math.random() * 100, 'render');
      Perf.recordMetric('api_call', Math.random() * 500, 'network');
      Perf.recordMetric('storage_write', Math.random() * 50, 'storage');
      
      const stats = Perf.getPerformanceStats();
      setPerfStats(stats);

      const cStats = {
        jobs: jobCache.getStats(),
        inventory: inventoryCache.getStats(),
        routes: routeCache.getStats(),
        nodes: nodeCache.getStats(),
      };
      setCacheStats(cStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const clearAllMetrics = () => {
    Perf.clearMetrics();
    jobCache.clear();
    inventoryCache.clear();
    routeCache.clear();
    nodeCache.clear();
    loadStats();
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Performance Metrics */}
            {perfStats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
                <MetricCard
                  title="Avg Render Time"
                  value={`${perfStats.averageRenderTime.toFixed(1)}ms`}
                  status={perfStats.averageRenderTime < 50 ? 'good' : 'warning'}
                />
                <MetricCard
                  title="Avg Network Time"
                  value={`${perfStats.averageNetworkTime.toFixed(0)}ms`}
                  status={perfStats.averageNetworkTime < 200 ? 'good' : 'warning'}
                />
              </View>
            )}

            {/* Cache Statistics */}
            {cacheStats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cache Performance</Text>
                <CacheCard cache="Job Cache" stats={cacheStats.jobs} />
                <CacheCard cache="Inventory Cache" stats={cacheStats.inventory} />
                <CacheCard cache="Route Cache" stats={cacheStats.routes} />
                <CacheCard cache="Node Cache" stats={cacheStats.nodes} />
              </View>
            )}

            {/* Metrics List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Operations</Text>
              <View style={styles.metricsTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Operation</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Duration</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Type</Text>
                </View>
                {Perf.getMetrics().slice(-5).map((m, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{m.name}</Text>
                    <Text style={styles.tableCell}>{m.duration}ms</Text>
                    <Text style={[styles.tableCell, { color: getCategoryColor(m.category) }]}>{m.category}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* System Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Information</Text>
              <InfoCard label="Metrics Recorded" value={Perf.getMetrics().length.toString()} />
              <InfoCard label="Total Operations" value={(perfStats?.totalCacheHits || 0 + perfStats?.totalCacheMisses || 0).toString()} />
              <TouchableOpacity style={styles.clearButton} onPress={clearAllMetrics}>
                <Text style={styles.clearButtonText}>Clear All Data</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Features</Text>
              <FeatureItem title="Real-time Metrics" description="Track render, network, and storage performance" />
              <FeatureItem title="Cache Analytics" description="Monitor cache hit rates and effectiveness" />
              <FeatureItem title="Memory Optimization" description="Automatic metrics pruning to prevent bloat" />
              <FeatureItem title="Performance History" description="View recent operations and trends" />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MetricCard({ title, value, status }: { title: string; value: string; status: 'good' | 'warning' }) {
  const statusColor = status === 'good' ? colors.chart.green : colors.chart.amber;
  return (
    <View style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 3 }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color: statusColor }]}>{value}</Text>
    </View>
  );
}

function CacheCard({ cache, stats }: { cache: string; stats: any }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{cache}</Text>
      <View style={styles.cacheStats}>
        <CacheStatRow label="Size" value={`${stats.size}`} />
        <CacheStatRow label="Hits" value={`${stats.hits}`} />
        <CacheStatRow label="Misses" value={`${stats.misses}`} />
        <CacheStatRow label="Hit Rate" value={`${stats.hitRate.toFixed(1)}%`} color={stats.hitRate > 50 ? colors.chart.green : colors.chart.amber} />
      </View>
    </View>
  );
}

function CacheStatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{label}</Text>
      <Text style={[{ fontSize: 10, fontWeight: '600' }, color ? { color } : { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'render': return colors.chart.cyan;
    case 'network': return colors.primary;
    case 'storage': return colors.chart.amber;
    case 'bluetooth': return colors.chart.purple;
    default: return colors.foreground;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { paddingVertical: 60, alignItems: 'center' },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '600' },
  cacheStats: { marginTop: 8 },
  metricsTable: { backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.card + '50', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeaderText: { color: colors.primary, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
  tableCell: { flex: 1, fontSize: 10, color: colors.foreground },
  infoCard: { backgroundColor: colors.card, borderRadius: 6, padding: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border },
  infoLabel: { fontSize: 11, color: colors.mutedForeground },
  infoValue: { fontSize: 12, fontWeight: '600', color: colors.primary },
  clearButton: { paddingVertical: 12, backgroundColor: colors.destructive + '20', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.destructive },
  clearButtonText: { fontSize: 12, fontWeight: '600', color: colors.destructive },
  featureItem: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  featureDesc: { fontSize: 10, color: colors.mutedForeground },
});
