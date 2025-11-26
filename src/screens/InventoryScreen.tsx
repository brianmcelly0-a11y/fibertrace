import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import * as Inventory from '@/lib/inventoryManagement';

const MOCK_ITEMS: Inventory.InventoryItem[] = [
  { id: 'itm1', itemId: 'INV-001', name: 'SMF Cable (500m)', type: 'Cable', description: 'Single Mode Fiber 500m spool', currentStock: 45, minimumStock: 20, maximumStock: 100, unit: 'piece', costPerUnit: 125, supplier: 'FiberCorp', lastRestocked: new Date().toISOString(), location: 'Warehouse A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'itm2', itemId: 'INV-002', name: '2x8 Splitter', type: 'Splitter', description: 'Single Mode 2x8 Splitter', currentStock: 8, minimumStock: 10, maximumStock: 40, unit: 'piece', costPerUnit: 450, supplier: 'OptiSys', lastRestocked: new Date().toISOString(), location: 'Warehouse A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'itm3', itemId: 'INV-003', name: 'FC/APC Connectors', type: 'Connector', description: 'FC/APC Connector Box (50pc)', currentStock: 120, minimumStock: 50, maximumStock: 200, unit: 'box', costPerUnit: 85, supplier: 'ConnectTech', lastRestocked: new Date().toISOString(), location: 'Warehouse B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'itm4', itemId: 'INV-004', name: 'Fusion Splicer', type: 'Tool', description: 'Optical Fiber Fusion Splicer', currentStock: 3, minimumStock: 2, maximumStock: 5, unit: 'piece', costPerUnit: 3200, supplier: 'FuseOp', lastRestocked: new Date().toISOString(), location: 'Equipment', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'itm5', itemId: 'INV-005', name: 'Closure Box', type: 'Closure', description: 'Fiber Optic Closure 288 core', currentStock: 12, minimumStock: 5, maximumStock: 30, unit: 'piece', costPerUnit: 280, supplier: 'ClosureMax', lastRestocked: new Date().toISOString(), location: 'Warehouse C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function InventoryScreen() {
  const [items, setItems] = useState<Inventory.InventoryItem[]>(MOCK_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Cable', supplier: '', cost: '0' });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate load
      setItems(MOCK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setItems(MOCK_ITEMS);
    } finally {
      setRefreshing(false);
    }
  };

  const stats = Inventory.getInventoryStats(items);
  const filteredItems = Inventory.searchInventory(items, searchQuery);

  const handleAddItem = () => {
    if (!formData.name.trim() || !formData.supplier.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const newItem = Inventory.createInventoryItem(
      formData.name,
      formData.type,
      '',
      50,
      parseFloat(formData.cost) || 0,
      formData.supplier
    );
    setItems([...items, newItem]);
    setFormData({ name: '', type: 'Cable', supplier: '', cost: '0' });
    setShowForm(false);
    Alert.alert('Success', `${formData.name} added to inventory`);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      { text: 'Delete', onPress: () => setItems(items.filter(i => i.id !== itemId)), style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatBox label="Total Items" value={String(stats.totalItems)} />
          <StatBox label="Low Stock" value={String(stats.lowStockItems)} color={stats.lowStockItems > 0 ? colors.destructive : colors.chart.green} />
          <StatBox label="Total Value" value={`$${(stats.totalValue / 1000).toFixed(1)}k`} />
          <StatBox label="Alerts" value={String(stats.activeAlerts)} color={colors.chart.amber} />
        </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search inventory..."
        placeholderTextColor={colors.mutedForeground}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Item name" value={formData.name} onChangeText={e => setFormData({ ...formData, name: e })} />
          <TextInput style={styles.input} placeholder="Supplier" value={formData.supplier} onChangeText={e => setFormData({ ...formData, supplier: e })} />
          <TextInput style={styles.input} placeholder="Cost per unit" keyboardType="decimal-pad" value={formData.cost} onChangeText={e => setFormData({ ...formData, cost: e })} />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddItem}>
            <Text style={styles.submitButtonText}>Save Item</Text>
          </TouchableOpacity>
        </View>
      )}

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>{searchQuery ? 'Try a different search' : 'Add your first inventory item'}</Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map(item => (
              <TouchableOpacity key={item.id} style={styles.itemCard} onLongPress={() => handleDeleteItem(item.id)}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemId}>{item.itemId}</Text>
                  </View>
                  <Text style={[styles.stockBadge, item.currentStock <= item.minimumStock && styles.stockBadgeLow]}>
                    {item.currentStock}
                  </Text>
                </View>
                <Text style={styles.itemType}>{item.type} • {item.supplier}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemCost}>${item.costPerUnit}/unit</Text>
                  <Text style={[styles.itemStatus, item.currentStock <= item.minimumStock && styles.itemStatusWarning]}>
                    Min: {item.minimumStock} {item.currentStock <= item.minimumStock && '⚠'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  statsContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 6, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 10, color: colors.mutedForeground, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  searchInput: { marginHorizontal: 12, marginVertical: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: colors.foreground },
  addButton: { marginHorizontal: 12, marginVertical: 8, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  addButtonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  form: { marginHorizontal: 12, marginVertical: 8, backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, color: colors.foreground, marginBottom: 8 },
  submitButton: { backgroundColor: colors.chart.green, paddingVertical: 8, borderRadius: 4, alignItems: 'center' },
  submitButtonText: { fontSize: 12, fontWeight: '600', color: colors.background },
  itemsList: { paddingHorizontal: 12, paddingBottom: 20 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  emptyStateText: { fontSize: 13, color: colors.mutedForeground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 20 },
  itemCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, opacity: 0.95 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.foreground, flex: 1 },
  itemId: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  stockBadge: { backgroundColor: colors.chart.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, color: colors.background, fontWeight: '600', fontSize: 12 },
  stockBadgeLow: { backgroundColor: colors.destructive },
  itemType: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  itemCost: { fontSize: 12, fontWeight: '600', color: colors.primary },
  itemStatus: { fontSize: 12, color: colors.mutedForeground },
  itemStatusWarning: { color: colors.chart.amber, fontWeight: '600' },
});
