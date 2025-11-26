// Workflow 2: MAP DATA OVERLAY - Load and render all network layers
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapNode, FiberLine, PowerReading, MapLayerVisibility } from './types';

const NODES_STORAGE_KEY = 'map_nodes';
const LINES_STORAGE_KEY = 'map_fiber_lines';
const POWER_STORAGE_KEY = 'map_power_readings';
const VISIBILITY_STORAGE_KEY = 'map_layer_visibility';

export async function loadAllNetworkLayers(): Promise<{
  nodes: MapNode[];
  lines: FiberLine[];
  powerReadings: PowerReading[];
}> {
  try {
    const [nodesData, linesData, powerData] = await Promise.all([
      AsyncStorage.getItem(NODES_STORAGE_KEY),
      AsyncStorage.getItem(LINES_STORAGE_KEY),
      AsyncStorage.getItem(POWER_STORAGE_KEY),
    ]);

    return {
      nodes: nodesData ? JSON.parse(nodesData) : [],
      lines: linesData ? JSON.parse(linesData) : [],
      powerReadings: powerData ? JSON.parse(powerData) : [],
    };
  } catch (error) {
    console.error('Error loading network layers:', error);
    return { nodes: [], lines: [], powerReadings: [] };
  }
}

export async function getLayerVisibility(): Promise<MapLayerVisibility> {
  try {
    const stored = await AsyncStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving layer visibility:', error);
  }

  return {
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
  };
}

export async function setLayerVisibility(visibility: MapLayerVisibility): Promise<void> {
  try {
    await AsyncStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  } catch (error) {
    console.error('Error saving layer visibility:', error);
  }
}

export function filterNodesByType(nodes: MapNode[], type: string): MapNode[] {
  return nodes.filter((n) => n.type === type);
}

export function filterNodesByPowerRange(nodes: MapNode[], minPower: number, maxPower: number): MapNode[] {
  return nodes.filter((n) => {
    const power = n.powerIn || 0;
    return power >= minPower && power <= maxPower;
  });
}

export function searchNodes(nodes: MapNode[], query: string): MapNode[] {
  const q = query.toLowerCase();
  return nodes.filter((n) =>
    n.name.toLowerCase().includes(q) ||
    n.nodeId.toLowerCase().includes(q) ||
    n.description?.toLowerCase().includes(q)
  );
}

export async function saveMapNodes(nodes: MapNode[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
  } catch (error) {
    console.error('Error saving nodes:', error);
  }
}

export async function saveFiberLines(lines: FiberLine[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.error('Error saving fiber lines:', error);
  }
}

export async function savePowerReadings(readings: PowerReading[]): Promise<void> {
  try {
    await AsyncStorage.setItem(POWER_STORAGE_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error('Error saving power readings:', error);
  }
}
