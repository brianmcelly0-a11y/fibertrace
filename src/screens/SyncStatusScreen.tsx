import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

export default function SyncStatusScreen() {
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(new Date(Date.now() - 300000));
  const [pendingItems, setPendingItems] = useState(3);

  const onRefresh = async () => {
    setRefreshing(true);
    setSyncing(true);
    setTimeout(() => {
      setLastSync(new Date());
      setPendingItems(0);
      setSyncing(false);
      setRefreshing(false);
    }, 1500);
  };

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setLastSync(new Date());
      setPendingItems(0);
      setSyncing(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getTimeDiff = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* Sync Status Card */}
      <View style={[styles.statusCard, syncing && { borderColor: colors.chart.green }]}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, syncing && styles.statusDotActive]} />
          <Text style={styles.statusTitle}>{syncing ? 'Syncing...' : 'All Synced'}</Text>
        </View>
        {lastSync && (
          <Text style={styles.statusTime}>Last sync: {formatTime(lastSync)} ({getTimeDiff(lastSync)})</Text>
        )}
        {pendingItems > 0 && (
          <Text style={styles.pendingText}>{pendingItems} items pending upload</Text>
        )}
      </View>

      {/* Sync Button */}
      {!syncing && (
        <TouchableOpacity style={styles.syncButton} onPress={handleManualSync}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}

      {syncing && (
        <View style={styles.syncingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.syncingText}>Synchronizing data...</Text>
        </View>
      )}

      {/* Pending Changes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Changes ({pendingItems})</Text>
        {pendingItems === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>All changes synced</Text>
          </View>
        ) : (
          <>
            <SyncItem title="Job JOB-001 updated" type="Job Update" time="2 minutes ago" status="pending" />
            <SyncItem title="Inventory: Cable added 50 units" type="Inventory" time="5 minutes ago" status="pending" />
            <SyncItem title="Route ROUTE-005 completed" type="Route" time="10 minutes ago" status="pending" />
          </>
        )}
      </View>

      {/* Sync History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Syncs</Text>
        <SyncHistoryItem time="Today 2:45 PM" status="success" items={8} />
        <SyncHistoryItem time="Today 1:30 PM" status="success" items={12} />
        <SyncHistoryItem time="Today 9:15 AM" status="success" items={5} />
        <SyncHistoryItem time="Yesterday 4:20 PM" status="failed" items={3} />
      </View>

      {/* Connectivity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connectivity Status</Text>
        <ConnectivityItem label="Internet Connection" status="connected" />
        <ConnectivityItem label="Server Connection" status="connected" />
        <ConnectivityItem label="Database" status="connected" />
        <ConnectivityItem label="Bluetooth" status="disconnected" />
      </View>

      {/* Sync Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Settings</Text>
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Auto Sync Interval</Text>
          <Text style={styles.settingValue}>Every 5 minutes</Text>
        </View>
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Sync Over WiFi Only</Text>
          <Text style={styles.settingValue}>Disabled</Text>
        </View>
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Conflict Resolution</Text>
          <Text style={styles.settingValue}>3-way merge</Text>
        </View>
      </View>

      {/* Storage Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        <StorageBar label="Synced Data" value={74} color={colors.chart.green} />
        <StorageBar label="Pending Data" value={18} color={colors.chart.amber} />
        <StorageBar label="Cache" value={8} color={colors.chart.cyan} />
      </View>
    </ScrollView>
  );
}

function SyncItem({ title, type, time, status }: { title: string; type: string; time: string; status: string }) {
  const statusColor = status === 'pending' ? colors.chart.amber : colors.chart.green;
  return (
    <View style={styles.syncItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.syncItemTitle}>{title}</Text>
        <View style={styles.syncItemMeta}>
          <Text style={styles.syncItemType}>{type}</Text>
          <Text style={styles.syncItemTime}>{time}</Text>
        </View>
      </View>
      <View style={[styles.syncItemStatus, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.syncItemStatusText, { color: statusColor }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

function SyncHistoryItem({ time, status, items }: { time: string; status: 'success' | 'failed'; items: number }) {
  return (
    <View style={styles.historyItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.historyDot, { backgroundColor: status === 'success' ? colors.chart.green : colors.destructive }]} />
        <View>
          <Text style={styles.historyTime}>{time}</Text>
          <Text style={styles.historyStatus}>{status === 'success' ? 'Synced' : 'Failed'}</Text>
        </View>
      </View>
      <Text style={styles.historyItems}>{items} items</Text>
    </View>
  );
}

function ConnectivityItem({ label, status }: { label: string; status: 'connected' | 'disconnected' }) {
  return (
    <View style={styles.connectivityItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.connectDot, { backgroundColor: status === 'connected' ? colors.chart.green : colors.border }]} />
        <Text style={styles.connectLabel}>{label}</Text>
      </View>
      <Text style={[styles.connectStatus, { color: status === 'connected' ? colors.chart.green : colors.mutedForeground }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

function StorageBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.storageItem}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={styles.storageLabel}>{label}</Text>
        <Text style={[styles.storageValue, { color }]}>{value}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingBottom: 20 },
  statusCard: { margin: 12, padding: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 2, borderColor: colors.border },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.chart.green, marginRight: 8 },
  statusDotActive: { backgroundColor: colors.primary },
  statusTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  statusTime: { fontSize: 11, color: colors.mutedForeground },
  pendingText: { fontSize: 11, color: colors.chart.amber, marginTop: 6 },
  syncButton: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 6, alignItems: 'center' },
  syncButtonText: { fontSize: 12, fontWeight: '600', color: colors.background },
  syncingContainer: { alignItems: 'center', paddingVertical: 40 },
  syncingText: { fontSize: 12, color: colors.mutedForeground, marginTop: 12 },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 12, textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.card, borderRadius: 6 },
  emptyText: { fontSize: 11, color: colors.mutedForeground },
  syncItem: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  syncItemTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  syncItemMeta: { flexDirection: 'row', gap: 8 },
  syncItemType: { fontSize: 9, color: colors.primary, fontWeight: '600' },
  syncItemTime: { fontSize: 9, color: colors.mutedForeground },
  syncItemStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  syncItemStatusText: { fontSize: 9, fontWeight: '600' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyTime: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  historyStatus: { fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  historyItems: { fontSize: 10, fontWeight: '600', color: colors.primary },
  connectivityItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  connectDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  connectLabel: { fontSize: 11, color: colors.foreground },
  connectStatus: { fontSize: 10, fontWeight: '600' },
  settingCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  settingLabel: { fontSize: 10, color: colors.mutedForeground, marginBottom: 4 },
  settingValue: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  storageItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  storageLabel: { fontSize: 11, color: colors.mutedForeground },
  storageValue: { fontSize: 11, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
