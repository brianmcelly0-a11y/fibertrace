// Workflow 4: ADDING NEW FIBER INFRASTRUCTURE - Node/line creation and GPS trace
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapNode, FiberLine, GeoPoint } from './types';
import { calculatePathDistance } from './distanceCalculation';

const NODES_STORAGE_KEY = 'map_nodes';
const LINES_STORAGE_KEY = 'map_fiber_lines';

export async function createNewNode(node: Omit<MapNode, 'id'>): Promise<MapNode> {
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newNode: MapNode = {
    ...node,
    id,
    lastUpdate: Date.now(),
  };

  try {
    const stored = await AsyncStorage.getItem(NODES_STORAGE_KEY);
    const nodes: MapNode[] = stored ? JSON.parse(stored) : [];
    nodes.push(newNode);
    await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
  } catch (error) {
    console.error('Error creating node:', error);
  }

  return newNode;
}

export async function createNewFiberLine(line: Omit<FiberLine, 'id'>): Promise<FiberLine> {
  const id = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newLine: FiberLine = {
    ...line,
    id,
  };

  try {
    const stored = await AsyncStorage.getItem(LINES_STORAGE_KEY);
    const lines: FiberLine[] = stored ? JSON.parse(stored) : [];
    lines.push(newLine);
    await AsyncStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.error('Error creating fiber line:', error);
  }

  return newLine;
}

export async function createLineFromGPSTrace(
  startNodeId: string,
  endNodeId: string,
  tracePoints: GeoPoint[]
): Promise<Omit<FiberLine, 'id'>> {
  const distance = calculatePathDistance(tracePoints);
  const slackPercentage = 10;

  return {
    startNodeId,
    endNodeId,
    straightDistance: 0, // Will be calculated separately
    routeDistance: distance,
    cableLength: distance * (1 + slackPercentage / 100),
    slackPercentage,
    points: tracePoints,
    type: 'distribution',
    createdAt: Date.now(),
    lastUpdate: Date.now(),
  };
}

export async function deleteNode(nodeId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NODES_STORAGE_KEY);
    if (stored) {
      const nodes: MapNode[] = JSON.parse(stored);
      const filtered = nodes.filter((n) => n.id !== nodeId);
      await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Error deleting node:', error);
  }
}

export async function deleteFiberLine(lineId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LINES_STORAGE_KEY);
    if (stored) {
      const lines: FiberLine[] = JSON.parse(stored);
      const filtered = lines.filter((l) => l.id !== lineId);
      await AsyncStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Error deleting fiber line:', error);
  }
}

export async function updateNodeLocation(nodeId: string, location: GeoPoint): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NODES_STORAGE_KEY);
    if (stored) {
      const nodes: MapNode[] = JSON.parse(stored);
      const updated = nodes.map((n) =>
        n.id === nodeId
          ? { ...n, latitude: location.latitude, longitude: location.longitude, lastUpdate: Date.now() }
          : n
      );
      await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error updating node location:', error);
  }
}
