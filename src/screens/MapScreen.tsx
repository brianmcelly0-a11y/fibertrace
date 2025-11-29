import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { colors } from '../theme/colors';
import * as MapModule from '../lib/mapModule';

// Import actual map components for native platforms
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available, using fallback');
    MapView = (props: any) => <View style={[props.style, { backgroundColor: colors.background }]} />;
    Marker = () => null;
    Polyline = () => null;
  }
} else {
  // Stubs for web
  MapView = (props: any) => <View style={[props.style, { backgroundColor: colors.background }]} />;
  Marker = () => null;
  Polyline = () => null;
}

const { width, height } = Dimensions.get('window');

interface Node {
  id?: string;
  latitude: number;
  longitude: number;
  name: string;
  type: string;
  nodeId?: string;
  inputPower?: number;
  outputPower?: number;
  category?: string;
  description?: string;
}

export function MapScreen() {
  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground, marginBottom: 10 }}>Map - Web Disabled</Text>
        <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
          Full interactive maps available on native Android/iOS devices.
        </Text>
      </View>
    );
  }

  // ===== WORKFLOW 1: MAP LOADING =====
  const [region, setRegion] = useState<MapModule.MapRegion>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [currentLocation, setCurrentLocation] = useState<MapModule.GeoPoint | null>(null);

  useEffect(() => {
    (async () => {
      const initialRegion = await MapModule.loadMapInitialState();
      setRegion(initialRegion);
      setCurrentLocation({ latitude: initialRegion.latitude, longitude: initialRegion.longitude });
      
      // Load offline GPS status
      const status = await MapModule.getOfflineMapStatus();
      setOfflineMapStatus(status);
    })();
  }, []);

  // ===== WORKFLOW 2: MAP DATA OVERLAY =====
  const [allNodes, setAllNodes] = useState<MapModule.MapNode[]>([]);
  const [fiberLines, setFiberLines] = useState<MapModule.FiberLine[]>([]);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [layerVisibility, setLayerVisibilityState] = useState<MapModule.MapLayerVisibility>({
    olts: true,
    splitters: true,
    fats: true,
    atbs: true,
    closures: true,
    fiberLines: true,
    powerReadings: false,
    jobs: true,
    inventory: false,
    issues: true,
  });

  const toggleLayer = (layer: keyof MapModule.MapLayerVisibility) => {
    setLayerVisibilityState(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Filter nodes based on layer visibility
  const getVisibleNodes = () => {
    return allNodes.filter(node => {
      const nodeType = node.type.toLowerCase();
      if (nodeType.includes('olt')) return layerVisibility.olts;
      if (nodeType.includes('splitter')) return layerVisibility.splitters;
      if (nodeType.includes('fat')) return layerVisibility.fats;
      if (nodeType.includes('atb')) return layerVisibility.atbs;
      if (nodeType.includes('closure')) return layerVisibility.closures;
      return true;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { api } = await import('../lib/api');
        const [nodes, routes, closures, splitters] = await Promise.all([
          api.getNodes().catch(() => []),
          api.getRoutes().catch(() => []),
          api.getClosures().catch(() => []),
          api.getSplitters().catch(() => []),
        ]);

        // Transform backend data to map format
        const mapNodes = [
          ...nodes.map((n: any) => ({
            id: n.id?.toString() || '',
            latitude: n.latitude || 0,
            longitude: n.longitude || 0,
            name: n.node_name || 'Node',
            type: n.node_type?.toLowerCase() || 'node',
            power: n.power_rating || 0,
          })),
          ...closures.map((c: any) => ({
            id: 'closure-' + c.id?.toString(),
            latitude: c.latitude || 0,
            longitude: c.longitude || 0,
            name: c.closure_name || 'Closure',
            type: c.closure_type?.toLowerCase() || 'closure',
            power: 0,
          })),
        ];

        const mapLines = routes.map((r: any) => ({
          id: r.id?.toString() || '',
          name: r.line_name || 'Route',
          startLat: r.start_latitude || 0,
          startLng: r.start_longitude || 0,
          endLat: r.end_latitude || 0,
          endLng: r.end_longitude || 0,
          fiberCount: r.fiber_count || 0,
        }));

        setAllNodes(mapNodes);
        setFiberLines(mapLines);
        const visibility = await MapModule.getLayerVisibility();
        setLayerVisibilityState(visibility);
      } catch (error) {
        console.error('Failed to load map data:', error);
      }
    })();
  }, []);

  // ===== WORKFLOW 3: MAP INTERACTION =====
  const [selectedNode, setSelectedNode] = useState<MapModule.MapNode | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);

  const handleMapPress = (location: MapModule.GeoPoint) => {
    const node = MapModule.detectNodeAtLocation(allNodes, location, 0.05);
    if (node) {
      setSelectedNode(node);
      setShowNodePanel(true);
    }
  };

  // ===== WORKFLOW 4: INFRASTRUCTURE MANAGEMENT + OFFLINE GPS =====
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'OLT' | 'Splitter' | 'FAT' | 'ATB' | 'DomeClosure'>('FAT');
  const [isTracking, setIsTracking] = useState(false);
  const [gpsPath, setGpsPath] = useState<MapModule.GeoPoint[]>([]);
  const [trackedDistance, setTrackedDistance] = useState(0);
  const [offlineMapStatus, setOfflineMapStatus] = useState<any>(null);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);

  const handleAddNode = async () => {
    if (!currentLocation || !newNodeName) {
      Alert.alert('Error', 'Please enter a node name and have location enabled');
      return;
    }

    const newNode = await MapModule.createNewNode({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      type: newNodeType,
      nodeId: `${newNodeType.toUpperCase()}-${Date.now()}`,
      name: newNodeName,
      category: 'Distribution',
      source: 'manual',
    });

    setAllNodes([...allNodes, newNode]);
    await MapModule.saveMapNodes([...allNodes, newNode]);
    setShowAddNodeModal(false);
    setNewNodeName('');
    Alert.alert('Success', `Node "${newNodeName}" added to map`);
  };

  const startGPSTrace = () => {
    setIsTracking(true);
    setGpsPath([]);
    setTrackedDistance(0);
    if (currentLocation) {
      setGpsPath([currentLocation]);
    }
  };

  const stopGPSTrace = async () => {
    setIsTracking(false);
    if (gpsPath.length > 1 && allNodes.length >= 2) {
      const distance = MapModule.calculatePathDistance(gpsPath);
      setTrackedDistance(distance);

      const line = await MapModule.createLineFromGPSTrace(
        allNodes[0].id,
        allNodes[1].id,
        gpsPath
      );

      const newLine = await MapModule.createNewFiberLine(line);
      setFiberLines([...fiberLines, newLine]);
      await MapModule.saveFiberLines([...fiberLines, newLine]);

      // Cache the route for offline access
      await MapModule.cacheOfflineRoute(`Route-${Date.now()}`, gpsPath);

      Alert.alert('GPS Trace Complete', `Distance: ${distance.toFixed(3)} km\nRoute cached for offline`);
    }
  };

  // ===== WORKFLOW 5: AUTO DISTANCE CALCULATION =====
  const getLineDistance = (line: MapModule.FiberLine) => {
    return `${line.straightDistance.toFixed(3)} km (route: ${line.routeDistance.toFixed(3)} km)`;
  };

  // ===== WORKFLOW 6: POWER MAPPING =====
  const [powerReadings, setPowerReadings] = useState<MapModule.PowerReading[]>([]);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [powerIn, setPowerIn] = useState('');

  const recordPower = async () => {
    if (!selectedNode || !powerIn) {
      Alert.alert('Error', 'Select a node and enter power value');
      return;
    }

    const reading = await MapModule.recordManualPowerEntry(
      selectedNode.id,
      parseFloat(powerIn)
    );

    setPowerReadings([...powerReadings, reading]);
    await MapModule.savePowerReadings([...powerReadings, reading]);
    setPowerIn('');
    setShowPowerModal(false);
    Alert.alert('Success', `Power reading recorded for ${selectedNode.name}`);

    // Queue for offline-first sync
    await MapModule.queueOfflineAction({
      id: reading.id,
      type: 'power_recording',
      nodeId: selectedNode.id,
      timestamp: Date.now(),
    });
  };

  // ===== WORKFLOW 7: NODE LINKING =====
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkNodeId, setLinkNodeId] = useState('');

  const linkNodes = async () => {
    if (!selectedNode || !linkNodeId) {
      Alert.alert('Error', 'Select source and target nodes');
      return;
    }

    await MapModule.linkNodes(selectedNode.id, linkNodeId, undefined, 'parent-child');
    setShowLinkModal(false);
    Alert.alert('Success', 'Nodes linked');
  };

  // ===== WORKFLOW 8: DAILY REPORTS =====
  const generateReport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const report = await MapModule.generateDailyReport(today, 'current-tech');

    const csv = MapModule.generateReportCSV(report);
    Alert.alert('Daily Report', `Generated report with ${report.actions.length} actions\nTotal distance: ${report.totalDistance.toFixed(2)} km`);
  };

  // ===== WORKFLOW 9: CLOUD SYNC =====
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced'>('offline');

  const syncToCloud = async () => {
    setSyncStatus('syncing');
    const isOnline = await MapModule.checkInternetConnection();

    if (isOnline) {
      const result = await MapModule.syncToCloud(
        'https://api.fibertrace.app/api',
        'auth-token-here'
      );

      if (result.success) {
        setSyncStatus('synced');
        Alert.alert('Sync Complete', 'All data synced to cloud');
      } else {
        setSyncStatus('offline');
        Alert.alert('Sync Failed', 'Will retry when online');
      }
    } else {
      setSyncStatus('offline');
      Alert.alert('Offline', 'Data queued for sync when online');
    }
  };

  // ===== WORKFLOW 10: OFFLINE FIRST =====
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      const count = await MapModule.getPendingActionsCount();
      setPendingActions(count);
    };
    checkPending();
  }, []);

  const nodeColors: Record<string, string> = {
    OLT: '#10b981',
    Splitter: '#3b82f6',
    FAT: '#f59e0b',
    ATB: '#ec4899',
    DomeClosure: '#8b5cf6',
    UndergroundClosure: '#8b5cf6',
    PedestalCabinet: '#06b6d4',
    Junction: '#a855f7',
    MiniNode: '#f59e0b',
    DPBox: '#84cc16',
  };

  return (
    <View style={styles.container}>
      {/* MAP VIEW */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChange={setRegion}
      >
        {/* FIBER LINES OVERLAY */}
        {layerVisibility.fiberLines && fiberLines.map((line) => (
          // @ts-ignore - Mobile-only component
          <Polyline
            key={`line-${line.id}`}
            coordinates={[
              { latitude: line.startLat, longitude: line.startLng },
              { latitude: line.endLat, longitude: line.endLng }
            ]}
            strokeColor="#3B82F6"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        ))}

        {/* NODE MARKERS OVERLAY */}
        {getVisibleNodes().map((node) => {
          // @ts-ignore - Mobile-only component
          return (
            <Marker
              key={node.id}
              coordinate={{ latitude: node.latitude, longitude: node.longitude }}
              pinColor={nodeColors[node.type] || colors.primary}
              title={node.name}
              onPress={() => handleMapPress({ latitude: node.latitude, longitude: node.longitude })}
            />
          );
        })}

        {/* CURRENT LOCATION MARKER */}
        {currentLocation && (
          // @ts-ignore - Mobile-only component
          <Marker
            coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
            pinColor={colors.primary}
            title="Your Location"
          />
        )}

        {/* GPS TRACE OVERLAY */}
        {gpsPath.length > 1 && (
          // @ts-ignore - Mobile-only component
          <Polyline
            coordinates={gpsPath}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* SELECTED NODE PANEL */}
      {selectedNode && showNodePanel && (
        <View style={styles.nodePanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.nodeName}>{selectedNode.name}</Text>
            <TouchableOpacity onPress={() => setShowNodePanel(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.nodeType}>{selectedNode.type}</Text>
          {selectedNode.powerIn && (
            <Text style={styles.nodeInfo}>Power: {selectedNode.powerIn.toFixed(2)} dBm</Text>
          )}
          <Text style={styles.nodeInfo}>ID: {selectedNode.nodeId}</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPowerModal(true)}>
              <Text style={styles.actionBtnText}>Power</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={() => setShowLinkModal(true)}>
              <Text style={styles.actionBtnText}>Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={generateReport}>
              <Text style={styles.actionBtnText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CONTROL PANEL */}
      <View style={styles.controlPanel}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => setShowAddNodeModal(true)}
          >
            <Text style={styles.buttonText}>+ Node</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent, flex: 1, marginLeft: 8 }]}
            onPress={isTracking ? stopGPSTrace : startGPSTrace}
          >
            <Text style={styles.buttonText}>{isTracking ? 'Stop GPS' : 'Start GPS'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: syncStatus === 'synced' ? '#10b981' : colors.primary, flex: 1, marginLeft: 8 }]}
            onPress={syncToCloud}
          >
            <Text style={styles.buttonText}>Sync</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, flex: 1, marginLeft: 8 }]}
            onPress={() => setShowOfflineSettings(true)}
          >
            <Text style={styles.buttonText}>Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, flex: 1, marginLeft: 8 }]}
            onPress={() => setShowLayerPanel(true)}
          >
            <Text style={styles.buttonText}>Layers</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.statsText}>
          Visible: {getVisibleNodes().length} | Lines: {layerVisibility.fiberLines ? fiberLines.length : 0} | Pending: {pendingActions}
        </Text>
        {offlineMapStatus && (
          <Text style={styles.statsText}>
            Tiles: {offlineMapStatus.cachedTiles} | Routes: {offlineMapStatus.cachedRoutes} | Size: {offlineMapStatus.totalCacheSize}
          </Text>
        )}
      </View>

      {/* ADD NODE MODAL */}
      <Modal visible={showAddNodeModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Node</Text>

            <TextInput
              style={styles.input}
              placeholder="Node Name"
              placeholderTextColor={colors.mutedForeground}
              value={newNodeName}
              onChangeText={setNewNodeName}
            />

            <View style={styles.typeSelector}>
              {(['OLT', 'Splitter', 'FAT', 'ATB', 'DomeClosure'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    { backgroundColor: newNodeType === type ? colors.primary : colors.card },
                  ]}
                  onPress={() => setNewNodeType(type)}
                >
                  <Text style={styles.typeText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddNode}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.mutedForeground, marginLeft: 8 }]} onPress={() => setShowAddNodeModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POWER MODAL */}
      <Modal visible={showPowerModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Power Reading</Text>

            <TextInput
              style={styles.input}
              placeholder="Power In (dBm)"
              placeholderTextColor={colors.mutedForeground}
              value={powerIn}
              onChangeText={setPowerIn}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={recordPower}>
                <Text style={styles.buttonText}>Record</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.mutedForeground, marginLeft: 8 }]} onPress={() => setShowPowerModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LINK MODAL */}
      <Modal visible={showLinkModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Node</Text>

            <ScrollView>
              {allNodes
                .filter((n) => n.id !== selectedNode?.id)
                .map((node) => (
                  <TouchableOpacity
                    key={node.id}
                    style={[styles.listItem, { backgroundColor: linkNodeId === node.id ? colors.primary : colors.card }]}
                    onPress={() => setLinkNodeId(node.id)}
                  >
                    <Text style={styles.listItemText}>{node.name} ({node.type})</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={linkNodes}>
                <Text style={styles.buttonText}>Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.mutedForeground, marginLeft: 8 }]} onPress={() => setShowLinkModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LAYER VISIBILITY PANEL */}
      <Modal visible={showLayerPanel} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Map Layers</Text>

            <ScrollView style={{ maxHeight: '70%' }}>
              {Object.entries(layerVisibility).map(([layer, visible]) => (
                <TouchableOpacity
                  key={layer}
                  style={[styles.layerToggle, { backgroundColor: visible ? colors.primary : colors.card }]}
                  onPress={() => toggleLayer(layer as keyof MapModule.MapLayerVisibility)}
                >
                  <Text style={styles.layerText}>
                    {visible ? '✓ ' : '○ '}{layer.charAt(0).toUpperCase() + layer.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.mutedForeground, marginTop: 12 }]}
              onPress={() => setShowLayerPanel(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OFFLINE MAP CACHE SETTINGS */}
      <Modal visible={showOfflineSettings} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Offline Map Cache</Text>

            {offlineMapStatus && (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>📍 Tiles: {offlineMapStatus.cachedTiles}</Text>
                <Text style={styles.statusText}>🗺️ Routes: {offlineMapStatus.cachedRoutes}</Text>
                <Text style={styles.statusText}>📊 GPS Points: {offlineMapStatus.gpsHistoryPoints}</Text>
                <Text style={styles.statusText}>💾 Size: {offlineMapStatus.totalCacheSize}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.settingBtn, { backgroundColor: colors.primary, marginBottom: 8 }]}
              onPress={async () => {
                const tilesCached = await MapModule.cacheMapTilesForRegion(region, 15);
                const status = await MapModule.getOfflineMapStatus();
                setOfflineMapStatus(status);
                Alert.alert('Cache Updated', `${tilesCached} tiles cached for offline`);
              }}
            >
              <Text style={styles.buttonText}>Cache Current Region</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingBtn, { backgroundColor: colors.accent, marginBottom: 8 }]}
              onPress={async () => {
                await MapModule.clearOfflineMapCache();
                const status = await MapModule.getOfflineMapStatus();
                setOfflineMapStatus(status);
                Alert.alert('Cache Cleared', 'All offline maps cleared');
              }}
            >
              <Text style={styles.buttonText}>Clear Cache</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingBtn, { backgroundColor: colors.mutedForeground }]}
              onPress={() => setShowOfflineSettings(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
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
  map: {
    flex: 1,
    width: '100%',
  },
  nodePanel: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: '40%',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeName: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: colors.foreground,
    fontSize: 24,
  },
  nodeType: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 4,
  },
  nodeInfo: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.primaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  statsText: {
    color: colors.mutedForeground,
    fontSize: 11,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  typeText: {
    color: colors.primaryForeground,
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  listItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    color: colors.foreground,
    fontSize: 14,
  },
  statusBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    color: colors.foreground,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  settingBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  layerToggle: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  layerText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
});
