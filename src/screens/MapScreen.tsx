import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { colors } from '../theme/colors';
import { calculateDistance } from '../lib/utils';
import { JobFormModal } from './JobFormModal';

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [gpsPath, setGpsPath] = useState<[number, number][]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [showJobForm, setShowJobForm] = useState(false);

  // Fetch nodes from backend
  const { data: olts = [] } = useQuery({
    queryKey: ['/api/olts'],
    queryFn: () => api.getOlts(),
  });

  const { data: splitters = [] } = useQuery({
    queryKey: ['/api/splitters'],
    queryFn: () => api.getSplitters(),
  });

  const { data: fats = [] } = useQuery({
    queryKey: ['/api/fats'],
    queryFn: () => api.getFats(),
  });

  const { data: atbs = [] } = useQuery({
    queryKey: ['/api/atbs'],
    queryFn: () => api.getAtbs(),
  });

  const { data: closures = [] } = useQuery({
    queryKey: ['/api/closures'],
    queryFn: () => api.getClosures(),
  });

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setCurrentLocation(location.coords);
        setRegion(coords);
      }
    })();
  }, []);

  // Start GPS tracking
  const startTracking = async () => {
    setIsTracking(true);
    setGpsPath([]);
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
      },
      (location) => {
        const coord: [number, number] = [
          location.coords.latitude,
          location.coords.longitude,
        ];
        setCurrentLocation(location.coords);
        setGpsPath((prev) => [...prev, coord]);
      }
    );

    return () => subscription.remove();
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  // Combine all nodes
  const allNodes = [
    ...olts.map((n: any) => ({ ...n, type: 'OLT', nodeId: `olt-${n.id}` })),
    ...splitters.map((n: any) => ({ ...n, type: 'Splitter', nodeId: `splitter-${n.id}` })),
    ...fats.map((n: any) => ({ ...n, type: 'FAT', nodeId: `fat-${n.id}` })),
    ...atbs.map((n: any) => ({ ...n, type: 'ATB', nodeId: `atb-${n.id}` })),
    ...closures.map((n: any) => ({ ...n, type: 'Closure', nodeId: `closure-${n.id}` })),
  ];

  const nodeColors: Record<string, string> = {
    OLT: '#10b981',
    Splitter: '#3b82f6',
    FAT: '#f59e0b',
    ATB: '#ec4899',
    Closure: '#8b5cf6',
  };

  const toggleNodeSelection = (nodeId: number) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChange={setRegion}
      >
        {/* Markers for all nodes */}
        {allNodes.map((node) => (
          <Marker
            key={node.nodeId}
            coordinate={{
              latitude: node.latitude,
              longitude: node.longitude,
            }}
            pinColor={selectedNodes.has(node.id) ? colors.primary : nodeColors[node.type]}
            title={node.name}
            description={`${node.type} - Power: ${node.inputPower || 'N/A'}`}
            onPress={() => {
              setSelectedNode(node);
              toggleNodeSelection(node.id);
            }}
          />
        ))}

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            pinColor={colors.primary}
            title="Your Location"
          />
        )}

        {/* GPS path */}
        {gpsPath.length > 1 && (
          <Polyline
            coordinates={gpsPath.map((p) => ({
              latitude: p[0],
              longitude: p[1],
            }))}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Bottom Panel - Node Info & Controls */}
      {selectedNode && (
        <View style={styles.nodePanel}>
          <Text style={styles.nodeName}>{selectedNode.name}</Text>
          <Text style={styles.nodeType}>{selectedNode.type}</Text>
          <Text style={styles.nodeInfo}>
            Power: {selectedNode.inputPower || 'N/A'} dB
          </Text>
          <Text style={styles.nodeInfo}>
            Location: {selectedNode.location || 'N/A'}
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlPanel}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.buttonText}>
              {isTracking ? 'Stop GPS' : 'Start GPS'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.accent,
                flex: 1,
                marginLeft: 8,
                opacity: selectedNodes.size > 0 ? 1 : 0.5,
              },
            ]}
            onPress={() => setShowJobForm(true)}
            disabled={selectedNodes.size === 0 && gpsPath.length === 0}
          >
            <Text style={styles.buttonText}>
              {selectedNodes.size > 0 ? `${selectedNodes.size} Nodes` : 'Create Job'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.statsText}>
          {gpsPath.length > 0
            ? `GPS Points: ${gpsPath.length} | Nodes: ${selectedNodes.size}`
            : `Nodes: ${selectedNodes.size}`}
        </Text>
      </View>

      {/* Job Form Modal */}
      <JobFormModal
        visible={showJobForm}
        onClose={() => setShowJobForm(false)}
        onSuccess={() => {
          setSelectedNodes(new Set());
          setGpsPath([]);
        }}
        gpsRoute={gpsPath}
        selectedNodeIds={Array.from(selectedNodes)}
      />
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
  },
  nodeName: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nodeType: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 8,
  },
  nodeInfo: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
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
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  statsText: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
  },
});
