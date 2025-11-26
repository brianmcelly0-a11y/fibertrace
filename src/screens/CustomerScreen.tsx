import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as CustomerManagement from '../lib/customerManagement';

export function CustomerScreen() {
  const [customers, setCustomers] = useState<CustomerManagement.Customer[]>([]);
  const [stats, setStats] = useState<CustomerManagement.CustomerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const loaded = await CustomerManagement.loadCustomers();
      setCustomers(loaded);
      setStats(CustomerManagement.getCustomerStats(loaded));
    } catch (error) {
      console.error('Failed to load customers:', error);
      Alert.alert('Error', 'Failed to load customers');
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

  const handleDeleteCustomer = (customerId: string) => {
    Alert.alert('Delete Customer', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const updated = customers.filter(c => c.id !== customerId);
          await CustomerManagement.saveCustomers(updated);
          setCustomers(updated);
          setStats(CustomerManagement.getCustomerStats(updated));
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
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <>
          {/* Stats Section */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Customer Network</Text>
              <View style={styles.statsGrid}>
                <StatItem label="Total Customers" value={stats.totalCustomers} color={colors.primary} />
                <StatItem label="Active" value={stats.activeCustomers} color={colors.chart.green} />
                <StatItem label="ONT Offline" value={stats.ontOfflineCount} color={colors.destructive} />
                <StatItem label="Low Power" value={stats.lowPowerCount} color={colors.chart.amber} />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Drop Cable:</Text>
                <Text style={styles.summaryValue}>{(stats.totalDropLength / 1000).toFixed(1)} km</Text>
              </View>
            </View>
          )}

          {/* Customers List */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Customers ({customers.length})</Text>
            {customers.length === 0 ? (
              <Text style={styles.emptyText}>No customers recorded yet</Text>
            ) : (
              customers.map(customer => (
                <CustomerItem
                  key={customer.id}
                  customer={customer}
                  onDelete={() => handleDeleteCustomer(customer.id)}
                />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function CustomerItem({ customer, onDelete }: any) {
  const powerTrend = CustomerManagement.getONTPowerTrend(customer);
  const powerHealth = CustomerManagement.checkPowerHealth(customer);

  const healthColor = powerHealth.status === 'Healthy' ? colors.chart.green : 
                      powerHealth.status === 'Warning' ? colors.chart.amber : 
                      colors.destructive;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTitle}>{customer.name}</Text>
          <Text style={styles.itemSubtitle}>{customer.customerId} • {customer.serviceType}</Text>
        </View>
        <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
          <Text style={styles.healthText}>{powerHealth.status}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <DetailRow label="Account" value={customer.accountNumber} />
        <DetailRow label="Status" value={customer.status} />
        <DetailRow label="Power" value={`${powerTrend.current.toFixed(1)} dBm`} />
        <DetailRow label="Drop" value={`${customer.dropCableLength}m`} />
        <DetailRow label="Readings" value={customer.ontPowerReadings.length} />
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
  summaryRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  summaryValue: {
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
