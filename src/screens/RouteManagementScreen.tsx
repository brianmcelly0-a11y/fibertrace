import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import * as RouteManagement from '../lib/routeManagement';

const { width } = Dimensions.get('window');

type Route = ReturnType<typeof RouteManagement.createRouteFromMapPoints>;

export function RouteManagementScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Distribution' as const,
    cableType: 'G652D' as const,
    cableSize: '48F',
  });

  const loadRoutes = async () => {
    try {
      const loadedRoutes = await RouteManagement.loadRouteDatabase();
      setRoutes(loadedRoutes);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const handleCreateRoute = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    try {
      const routeId = RouteManagement.suggestNextRouteId(routes);
      const newRoute = RouteManagement.createRouteFromMapPoints(
        {
          name: formData.name,
          type: formData.type,
          routeId,
          startNodeId: 1,
          endNodeId: 2,
          inventory: {
            cableType: formData.cableType,
            cableSize: formData.cableSize,
            totalLength: 1000,
            reserve: 100,
            spliceCount: 0,
          },
        },
        [
          { latitude: 37.78825, longitude: -122.4324 },
          { latitude: 37.78935, longitude: -122.4324 },
        ],
        'technician@company.com'
      );

      setRoutes([...routes, newRoute]);
      setFormData({ name: '', type: 'Distribution', cableType: 'G652D', cableSize: '48F' });
      setShowModal(false);
      Alert.alert('Success', `Route ${routeId} created`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create route');
    }
  };

  const getRouteColor = (type: string) => {
    const colorMap: Record<string, string> = {
      Backbone: '#0066FF',
      Distribution: '#FFCC00',
      Access: '#00CC44',
      Drop: '#FFFFFF',
    };
    return colorMap[type] || '#CCCCCC';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return colors.chart.green;
      case 'Under Construction':
        return colors.chart.amber;
      case 'Faulty':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const RouteCard = ({ route }: { route: Route }) => (
    <TouchableOpacity
      style={[styles.routeCard, { borderTopColor: getRouteColor(route.type) }]}
      onPress={() => {
        setSelectedRoute(route);
        setShowModal(true);
      }}
    >
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{route.name}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(route.status) }]}
        >
          <Text style={styles.statusText}>{route.status}</Text>
        </View>
      </View>

      <View style={styles.routeTypeRow}>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: getRouteColor(route.type) },
          ]}
        />
        <Text style={styles.routeType}>{route.type}</Text>
        <Text style={styles.routeId}>{route.routeId}</Text>
      </View>

      <View style={styles.routeDetails}>
        <DetailBadge
          label="Distance"
          value={`${(route.totalDistance / 1000).toFixed(2)} km`}
          color={colors.primary}
        />
        <DetailBadge
          label="Cable"
          value={route.inventory.cableSize}
          color={colors.chart.green}
        />
        <DetailBadge
          label="Faults"
          value={`${RouteManagement.getActiveFaults(route).length}`}
          color={colors.destructive}
        />
      </View>

      {route.faults && route.faults.some(f => !f.resolved) && (
        <View style={styles.faultWarning}>
          <Text style={styles.faultWarningText}>
            ⚠ {route.faults.filter(f => !f.resolved).length} active fault(s)
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const stats = RouteManagement.getRouteStats(routes);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatBox
          label="Total"
          value={stats.totalRoutes}
          color={colors.primary}
        />
        <StatBox
          label="Distance"
          value={`${(stats.totalDistance / 1000).toFixed(1)} km`}
          color={colors.chart.green}
        />
        <StatBox
          label="Active Faults"
          value={stats.routesWithFaults}
          color={colors.destructive}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setSelectedRoute(null);
          setFormData({ name: '', type: 'Distribution', cableType: 'G652D', cableSize: '48F' });
          setShowModal(true);
        }}
      >
        <Text style={styles.createButtonText}>+ Create Route</Text>
      </TouchableOpacity>

      {/* Routes List */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No routes yet</Text>
          <Text style={styles.emptySubtext}>Create a route to get started</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <RouteCard route={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>
                {selectedRoute ? 'Edit Route' : 'Create Route'}
              </Text>

              {/* Route Name */}
              <Text style={styles.label}>Route Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Main Distribution A"
                placeholderTextColor={colors.mutedForeground}
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />

              {/* Route Type */}
              <Text style={styles.label}>Route Type</Text>
              <View style={styles.typeGrid}>
                {(['Backbone', 'Distribution', 'Access', 'Drop'] as const).map((type: any) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      (formData.type as string) === type && styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        type: type as any,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.typeColorBox,
                        { backgroundColor: getRouteColor(type) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cable Type */}
              <Text style={styles.label}>Cable Type</Text>
              <View style={styles.cableGrid}>
                {(['ADSS', 'G652D', 'G657A', 'G657B'] as const).map((type: any) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.cableButton,
                      (formData.cableType as string) === type && styles.cableButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        cableType: type as any,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.cableButtonText,
                        formData.cableType === type && styles.cableButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cable Size */}
              <Text style={styles.label}>Cable Size (Fiber Count)</Text>
              <View style={styles.sizeGrid}>
                {['12F', '24F', '48F', '96F'].map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      formData.cableSize === size && styles.sizeButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        cableSize: size,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        formData.cableSize === size && styles.sizeButtonTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Route Details */}
              {selectedRoute && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsTitle}>Route Details</Text>
                  <DetailRow
                    label="Distance"
                    value={`${(selectedRoute.totalDistance / 1000).toFixed(2)} km`}
                  />
                  <DetailRow
                    label="Segments"
                    value={selectedRoute.segments.length}
                  />
                  <DetailRow
                    label="Splices"
                    value={selectedRoute.inventory.spliceCount}
                  />
                  <DetailRow
                    label="Status"
                    value={selectedRoute.status}
                  />
                  <DetailRow
                    label="Active Faults"
                    value={RouteManagement.getActiveFaults(selectedRoute).length}
                  />
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateRoute}
                >
                  <Text style={styles.submitButtonText}>
                    {selectedRoute ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function DetailBadge({ label, value, color }: any) {
  return (
    <View style={[styles.detailBadge, { borderColor: color }]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
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
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBox: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    margin: 12,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: colors.card,
    borderRadius: 6,
    borderTopWidth: 3,
    padding: 12,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  routeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  routeType: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginRight: 6,
  },
  routeId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  detailBadge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  badgeValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  faultWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftColor: colors.destructive,
    borderLeftWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  faultWarningText: {
    color: colors.destructive,
    fontSize: 11,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
  },
  modalScroll: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    color: colors.foreground,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  typeColorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 4,
  },
  typeButtonText: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  cableGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cableButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cableButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cableButtonText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  cableButtonTextActive: {
    color: 'white',
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: colors.chart.green,
    borderColor: colors.chart.green,
  },
  sizeButtonText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  sizeButtonTextActive: {
    color: 'white',
  },
  detailsBox: {
    backgroundColor: colors.card,
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
