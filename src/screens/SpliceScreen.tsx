import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as SpliceManagement from '../lib/spliceManagement';

export function SpliceScreen() {
  const [spliceMaps, setSpliceMaps] = useState<SpliceManagement.SpliceMap[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const loaded = await SpliceManagement.loadSpliceMaps();
      setSpliceMaps(loaded);
    } catch (error) {
      console.error('Failed to load splice maps:', error);
      Alert.alert('Error', 'Failed to load splice maps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteSpliceMap = (spliceId: string) => {
    Alert.alert('Delete Splice Map', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const updated = spliceMaps.filter(s => s.id !== spliceId);
          await SpliceManagement.saveSpliceMaps(updated);
          setSpliceMaps(updated);
        },
      },
    ]);
  };

  const getTotalStats = () => {
    let totalMappings = 0;
    let totalGood = 0;
    let totalHighLoss = 0;
    let totalFaults = 0;

    spliceMaps.forEach(map => {
      const stats = SpliceManagement.calculateSpliceStatistics(map);
      totalMappings += stats.totalSplices;
      totalGood += stats.goodCount;
      totalHighLoss += stats.highLossCount;
      totalFaults += stats.faultCount;
    });

    return { totalMappings, totalGood, totalHighLoss, totalFaults };
  };

  const stats = getTotalStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading splice maps...</Text>
        </View>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Splice Network</Text>
            <View style={styles.statsGrid}>
              <StatItem label="Total Fibers" value={stats.totalMappings} color={colors.primary} />
              <StatItem label="Good" value={stats.totalGood} color={colors.chart.green} />
              <StatItem label="High-Loss" value={stats.totalHighLoss} color={colors.chart.amber} />
              <StatItem label="Faults" value={stats.totalFaults} color={colors.destructive} />
            </View>
          </View>

          {/* Splice Maps List */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Splice Maps ({spliceMaps.length})</Text>
            {spliceMaps.length === 0 ? (
              <Text style={styles.emptyText}>No splice maps recorded yet</Text>
            ) : (
              spliceMaps.map(spliceMap => (
                <SpliceMapItem
                  key={spliceMap.id}
                  spliceMap={spliceMap}
                  onDelete={() => handleDeleteSpliceMap(spliceMap.id)}
                />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SpliceMapItem({ spliceMap, onDelete }: any) {
  const stats = SpliceManagement.calculateSpliceStatistics(spliceMap);
  const avgLoss = stats.avgLoss;

  const healthStatus = stats.faultCount > 0 ? 'Critical' : stats.highLossCount > 0 ? 'Warning' : 'Healthy';
  const healthColor = healthStatus === 'Healthy' ? colors.chart.green :
                      healthStatus === 'Warning' ? colors.chart.amber :
                      colors.destructive;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTitle}>Map: {spliceMap.id.substring(0, 12)}...</Text>
          <Text style={styles.itemSubtitle}>
            {spliceMap.cableInId} → {spliceMap.cableOutId}
          </Text>
        </View>
        <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
          <Text style={styles.healthText}>{healthStatus}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <DetailRow label="Fiber Mappings" value={stats.totalSplices} />
        <DetailRow label="Good Fibers" value={stats.goodCount} />
        <DetailRow label="Avg Loss" value={`${avgLoss.toFixed(2)} dB`} />
        <DetailRow label="High-Loss" value={stats.highLossCount} />
        <DetailRow label="Faults" value={stats.faultCount} />
      </View>

      <View style={styles.fiberVisualization}>
        <Text style={styles.vizTitle}>Fiber Status:</Text>
        <View style={styles.fiberList}>
          {spliceMap.fiberMappings.slice(0, 5).map((mapping, idx) => (
            <View key={idx} style={styles.fiberEntry}>
              <View
                style={[
                  styles.fiberDot,
                  {
                    backgroundColor:
                      mapping.status === 'Good' ? colors.chart.green :
                      mapping.status === 'High-Loss' ? colors.chart.amber :
                      colors.destructive,
                  },
                ]}
              />
              <Text style={styles.fiberText}>
                {mapping.inFiber} → {mapping.outFiber} ({mapping.lossReading.toFixed(2)}dB)
              </Text>
            </View>
          ))}
          {spliceMap.fiberMappings.length > 5 && (
            <Text style={styles.moreText}>+{spliceMap.fiberMappings.length - 5} more fibers</Text>
          )}
        </View>
      </View>

      <View style={styles.itemFooter}>
        <TouchableOpacity onPress={onDelete} style={[styles.button, { backgroundColor: colors.destructive }]}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: any) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  statsCard: {
    margin: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionCard: {
    margin: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  healthText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  detailValue: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  fiberVisualization: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  vizTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  fiberList: {
    backgroundColor: colors.card,
    borderRadius: 4,
    padding: 8,
  },
  fiberEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fiberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  fiberText: {
    color: colors.mutedForeground,
    fontSize: 11,
    flex: 1,
  },
  moreText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  button: {
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
