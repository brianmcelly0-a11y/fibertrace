import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { localDataService } from '../../services/LocalDataService';
import { db } from '../../lib/database';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  inventoryItems: number;
  lowStockItems: number;
  pendingSync: number;
  activeAnnouncements: number;
}

interface Props {
  onNavigate?: (screen: string) => void;
}

export function AdminDashboardScreen({ onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncHealth, setSyncHealth] = useState<'good' | 'warning' | 'error'>('good');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const dashboardStats = await localDataService.getDashboardStats();
      setStats(dashboardStats);

      if (dashboardStats.pendingSync > 10) {
        setSyncHealth('error');
      } else if (dashboardStats.pendingSync > 0) {
        setSyncHealth('warning');
      } else {
        setSyncHealth('good');
      }

      const auditLogs = await db.getSyncAuditLogs(1);
      if (auditLogs.length > 0) {
        setLastSyncTime(auditLogs[0].completed_at || auditLogs[0].started_at);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  const StatCard = ({ title, value, icon, color, onPress }: { 
    title: string; 
    value: number | string; 
    icon: string; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const syncHealthColors = {
    good: colors.chart.green,
    warning: colors.chart.amber,
    error: colors.destructive,
  };

  const syncHealthLabels = {
    good: 'All Synced',
    warning: 'Pending Sync',
    error: 'Sync Required',
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Organization Overview</Text>
      </View>

      <View style={styles.syncStatusCard}>
        <View style={styles.syncStatusHeader}>
          <View style={[styles.syncDot, { backgroundColor: syncHealthColors[syncHealth] }]} />
          <Text style={styles.syncStatusLabel}>{syncHealthLabels[syncHealth]}</Text>
        </View>
        <Text style={styles.syncPending}>
          {stats?.pendingSync || 0} pending sync items
        </Text>
        {lastSyncTime && (
          <Text style={styles.lastSync}>
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon="👥" 
          color={colors.primary}
          onPress={() => onNavigate?.('users')}
        />
        <StatCard 
          title="Active Jobs" 
          value={stats?.totalJobs || 0} 
          icon="📋" 
          color={colors.chart.blue}
          onPress={() => onNavigate?.('jobs')}
        />
        <StatCard 
          title="Pending Jobs" 
          value={stats?.pendingJobs || 0} 
          icon="⏳" 
          color={colors.chart.amber}
          onPress={() => onNavigate?.('jobs')}
        />
        <StatCard 
          title="Completed" 
          value={stats?.completedJobs || 0} 
          icon="✓" 
          color={colors.chart.green}
        />
        <StatCard 
          title="Inventory Items" 
          value={stats?.inventoryItems || 0} 
          icon="📦" 
          color={colors.chart.purple}
          onPress={() => onNavigate?.('inventory')}
        />
        <StatCard 
          title="Low Stock" 
          value={stats?.lowStockItems || 0} 
          icon="⚠️" 
          color={stats?.lowStockItems ? colors.destructive : colors.chart.green}
          onPress={() => onNavigate?.('inventory')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate?.('users')}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate?.('jobs')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Create Job</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate?.('inventory')}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Add Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate?.('announcements')}>
            <Text style={styles.actionIcon}>📢</Text>
            <Text style={styles.actionText}>New Announcement</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <View style={styles.announcementCard}>
          <Text style={styles.announcementCount}>
            {stats?.activeAnnouncements || 0} Active
          </Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => onNavigate?.('announcements')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  syncStatusCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  syncStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  syncPending: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  lastSync: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statTitle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  announcementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  announcementCount: {
    fontSize: 16,
    color: colors.foreground,
  },
  viewAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewAllText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AdminDashboardScreen;
