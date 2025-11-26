import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { colors } from '../theme/colors';
import * as Inventory from '@/lib/inventoryManagement';

export default function InventoryScreen() {
  const [items, setItems] = useState<Inventory.InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Cable', supplier: '', cost: '0' });

  const stats = Inventory.getInventoryStats(items);
  const filteredItems = Inventory.searchInventory(items, searchQuery);

  const handleAddItem = () => {
    const newItem = Inventory.createInventoryItem(
      formData.name,
      formData.type,
      '',
      50,
      parseFloat(formData.cost),
      formData.supplier
    );
    setItems([...items, newItem]);
    setFormData({ name: '', type: 'Cable', supplier: '', cost: '0' });
    setShowForm(false);
    Alert.alert('Success', 'Item added to inventory');
  };

  return (
    <View style={styles.container}>
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
      <ScrollView style={styles.itemsList}>
        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>No items found</Text>
        ) : (
          filteredItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.stockBadge, item.currentStock <= item.minimumStock && styles.stockBadgeLow]}>
                  {item.currentStock}
                </Text>
              </View>
              <Text style={styles.itemType}>{item.type} • {item.supplier}</Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemCost}>${item.costPerUnit}/unit</Text>
                <Text style={styles.itemStatus}>Min: {item.minimumStock}</Text>
              </View>
            </View>
          ))
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
  itemsList: { flex: 1, paddingHorizontal: 12 },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 20 },
  itemCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  stockBadge: { backgroundColor: colors.chart.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, color: colors.background, fontWeight: '600', fontSize: 12 },
  stockBadgeLow: { backgroundColor: colors.destructive },
  itemType: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  itemCost: { fontSize: 12, fontWeight: '600', color: colors.primary },
  itemStatus: { fontSize: 12, color: colors.mutedForeground },
});
