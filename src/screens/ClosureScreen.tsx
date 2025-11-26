import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as ClosureManagement from '../lib/closureManagement';

export function ClosureScreen() {
  const [closures, setClosures] = useState<ClosureManagement.Closure[]>([]);
  const [stats, setStats] = useState<ClosureManagement.ClosureStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const loaded = await ClosureManagement.loadClosures();
      setClosures(loaded);
      setStats(ClosureManagement.getClosureStats(loaded));
    } catch (error) {
      console.error('Failed to load closures:', error);
      Alert.alert('Error', 'Failed to load closures');
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

  const handleDeleteClosure = (closureId: string) => {
    Alert.alert('Delete Closure', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const updated = closures.filter(c => c.id !== closureId);
          await ClosureManagement.saveClosures(updated);
          setClosures(updated);
          setStats(ClosureManagement.getClosureStats(updated));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading closures...</Text>
        </View>
      ) : (
        <>
          {/* Stats Section */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Closure Network</Text>
              <View style={styles.statsGrid}>
                <StatItem label="Total Closures" value={stats.totalClosures} color={colors.primary} />
                <StatItem label="Active" value={stats.activeClosures} color={colors.chart.green} />
                <StatItem label="Total Splices" value={stats.totalSplices} color={colors.chart.blue} />
                <StatItem label="High Loss" value={stats.closuresWithHighLoss} color={colors.destructive} />
              </View>

              <View style={styles.typeBreakdown}>
                <Text style={styles.subTitle}>By Type</Text>
                {Object.entries(stats.byType).map(([type, count]) => (
                  count > 0 && (
                    <View key={type} style={styles.typeRow}>
                      <Text style={styles.typeLabel}>{type}</Text>
                      <Text style={styles.typeCount}>{count}</Text>
                    </View>
                  )
                ))}
              </View>
            </View>
          )}

          {/* Closures List */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Closures ({closures.length})</Text>
            {closures.length === 0 ? (
              <Text style={styles.emptyText}>No closures recorded yet</Text>
            ) : (
              closures.map(closure => (
                <ClosureItem
                  key={closure.id}
                  closure={closure}
                  onDelete={() => handleDeleteClosure(closure.id)}
                />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ClosureItem({ closure, onDelete }: any) {
  const avgLoss = ClosureManagement.calculateSpliceLoss(closure.splices);
  const powerImpact = ClosureManagement.getPowerImpact(closure);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTitle}>{closure.label}</Text>
          <Text style={styles.itemSubtitle}>{closure.type} • {closure.closureId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: closure.status === 'Active' ? colors.chart.green : colors.chart.amber }]}>
          <Text style={styles.statusText}>{closure.status}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <DetailRow label="Splices" value={closure.splices.length} />
        <DetailRow label="Avg Loss" value={`${avgLoss.toFixed(2)} dB`} />
        <DetailRow label="Fibers" value={closure.fiberCount} />
        <DetailRow label="Location" value={closure.locationType} />
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
    marginBottom: 12,
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
  typeBreakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  typeLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  typeCount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
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
