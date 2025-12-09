import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { localDataService } from '../../services/LocalDataService';
import { InventoryItem, generateId } from '../../lib/database';

interface Props {}

export function AdminInventoryScreen({}: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [newItem, setNewItem] = useState({
    itemCode: '',
    name: '',
    description: '',
    category: '',
    unit: 'pcs',
    initialQuantity: 0,
    minimumThreshold: 10,
    maximumThreshold: 100,
    unitCost: 0,
    location: '',
  });

  const [stockOperation, setStockOperation] = useState({
    type: 'In' as 'In' | 'Out' | 'Adjustment',
    quantity: 0,
    notes: '',
  });

  const categories = ['Fiber Cable', 'Connectors', 'Splitters', 'Tools', 'Equipment', 'Consumables', 'Other'];
  const units = ['pcs', 'meters', 'rolls', 'boxes', 'sets', 'kg', 'liters'];

  const loadItems = async () => {
    try {
      const loadedItems = await localDataService.getInventoryItems({
        category: filterCategory || undefined,
        lowStock: showLowStockOnly,
        search: searchQuery,
      });
      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filterCategory, showLowStockOnly, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!newItem.itemCode || !newItem.name) {
      Alert.alert('Error', 'Item code and name are required');
      return;
    }

    try {
      await localDataService.createInventoryItem({
        ...newItem,
        category: newItem.category || 'Other',
      });
      setShowAddModal(false);
      setNewItem({
        itemCode: '',
        name: '',
        description: '',
        category: '',
        unit: 'pcs',
        initialQuantity: 0,
        minimumThreshold: 10,
        maximumThreshold: 100,
        unitCost: 0,
        location: '',
      });
      await loadItems();
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleStockOperation = async () => {
    if (!selectedItem || stockOperation.quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      if (stockOperation.type === 'In') {
        await localDataService.addStock(selectedItem.id, stockOperation.quantity, stockOperation.notes);
      } else if (stockOperation.type === 'Out') {
        await localDataService.removeStock(selectedItem.id, stockOperation.quantity, undefined, undefined, stockOperation.notes);
      } else {
        await localDataService.adjustStock(selectedItem.id, stockOperation.quantity, stockOperation.notes);
      }
      setShowStockModal(false);
      setStockOperation({ type: 'In', quantity: 0, notes: '' });
      setSelectedItem(null);
      await loadItems();
      Alert.alert('Success', 'Stock updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update stock');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_on_hand <= item.minimum_threshold) {
      return { color: colors.destructive, label: 'Low' };
    }
    if (item.quantity_on_hand >= item.maximum_threshold) {
      return { color: colors.chart.amber, label: 'Excess' };
    }
    return { color: colors.chart.green, label: 'OK' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, showLowStockOnly && styles.filterChipActive]}
          onPress={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <Text style={[styles.filterChipText, showLowStockOnly && styles.filterChipTextActive]}>
            Low Stock Only
          </Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
          <TouchableOpacity
            style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {items.map(item => {
          const status = getStockStatus(item);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => {
                setSelectedItem(item);
                setShowStockModal(true);
              }}
            >
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemCode}>{item.item_code}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.itemCategory}>{item.category} • {item.location}</Text>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Qty:</Text>
                <Text style={[styles.quantityValue, { color: status.color }]}>
                  {item.quantity_on_hand} {item.unit}
                </Text>
                <Text style={styles.thresholds}>
                  (Min: {item.minimum_threshold} / Max: {item.maximum_threshold})
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Item Code *</Text>
              <TextInput
                style={styles.input}
                value={newItem.itemCode}
                onChangeText={v => setNewItem({ ...newItem, itemCode: v })}
                placeholder="e.g., FIB-001"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={newItem.name}
                onChangeText={v => setNewItem({ ...newItem, name: v })}
                placeholder="Item name"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newItem.description}
                onChangeText={v => setNewItem({ ...newItem, description: v })}
                placeholder="Description"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.chipContainer}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, newItem.category === cat && styles.chipActive]}
                    onPress={() => setNewItem({ ...newItem, category: cat })}
                  >
                    <Text style={[styles.chipText, newItem.category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.chipContainer}>
                {units.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, newItem.unit === u && styles.chipActive]}
                    onPress={() => setNewItem({ ...newItem, unit: u })}
                  >
                    <Text style={[styles.chipText, newItem.unit === u && styles.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Initial Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.initialQuantity.toString()}
                    onChangeText={v => setNewItem({ ...newItem, initialQuantity: parseInt(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Unit Cost</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.unitCost.toString()}
                    onChangeText={v => setNewItem({ ...newItem, unitCost: parseFloat(v) || 0 })}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Min Threshold</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.minimumThreshold.toString()}
                    onChangeText={v => setNewItem({ ...newItem, minimumThreshold: parseInt(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Max Threshold</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.maximumThreshold.toString()}
                    onChangeText={v => setNewItem({ ...newItem, maximumThreshold: parseInt(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={newItem.location}
                onChangeText={v => setNewItem({ ...newItem, location: v })}
                placeholder="e.g., Warehouse A, Shelf 1"
                placeholderTextColor={colors.mutedForeground}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleAddItem}>
                <Text style={styles.confirmButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showStockModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Stock Operation</Text>
            {selectedItem && (
              <>
                <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                <Text style={styles.selectedItemQty}>
                  Current: {selectedItem.quantity_on_hand} {selectedItem.unit}
                </Text>

                <View style={styles.operationTypes}>
                  {(['In', 'Out', 'Adjustment'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.operationChip, stockOperation.type === type && styles.operationChipActive]}
                      onPress={() => setStockOperation({ ...stockOperation, type })}
                    >
                      <Text style={[styles.operationChipText, stockOperation.type === type && styles.operationChipTextActive]}>
                        {type === 'In' ? 'Add Stock' : type === 'Out' ? 'Remove Stock' : 'Adjust'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>
                  {stockOperation.type === 'Adjustment' ? 'New Quantity' : 'Quantity'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={stockOperation.quantity.toString()}
                  onChangeText={v => setStockOperation({ ...stockOperation, quantity: parseInt(v) || 0 })}
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={stockOperation.notes}
                  onChangeText={v => setStockOperation({ ...stockOperation, notes: v })}
                  placeholder="Optional notes"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowStockModal(false);
                  setSelectedItem(null);
                  setStockOperation({ type: 'In', quantity: 0, notes: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleStockOperation}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  searchBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryFilters: {
    marginTop: 8,
  },
  filterChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemCode: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemCategory: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginRight: 4,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  thresholds: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.background,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  selectedItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  selectedItemQty: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
  },
  operationTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  operationChip: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  operationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  operationChipText: {
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  operationChipTextActive: {
    color: colors.background,
  },
});

export default AdminInventoryScreen;
