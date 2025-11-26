// Workflow 3: MAP INTERACTION - Node tap detection, panel display, quick actions
import { MapNode, GeoPoint } from './types';

export interface SelectedNodeContext {
  node: MapNode;
  connectedNodes: MapNode[];
  powerReadings: any[];
  attachments: string[];
  notes: string[];
}

export function detectNodeAtLocation(
  nodes: MapNode[],
  location: GeoPoint,
  radiusKm: number = 0.05
): MapNode | null {
  for (const node of nodes) {
    if (isWithinRadius(node, location, radiusKm)) {
      return node;
    }
  }
  return null;
}

function isWithinRadius(point1: GeoPoint, point2: GeoPoint, radiusKm: number): boolean {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLng = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
}

export function getNodeDisplayInfo(node: MapNode): Record<string, string | number> {
  return {
    'Node ID': node.nodeId,
    'Node Type': node.type,
    'Name': node.name,
    'Category': node.category || 'N/A',
    'Latitude': parseFloat(node.latitude.toFixed(6)),
    'Longitude': parseFloat(node.longitude.toFixed(6)),
    'Power In': node.powerIn ? `${node.powerIn.toFixed(2)} dBm` : 'N/A',
    'Power Out': node.powerOut ? `${node.powerOut.toFixed(2)} dBm` : 'N/A',
    'Last Update': node.lastUpdate ? new Date(node.lastUpdate).toLocaleString() : 'N/A',
    'Assigned Tech': node.assignedTech || 'Unassigned',
  };
}

export function getQuickActions(nodeType: string): string[] {
  const actions: Record<string, string[]> = {
    OLT: ['Edit', 'Link', 'Power', 'Report', 'View History'],
    Splitter: ['Edit', 'Link', 'Power', 'Report', 'View History'],
    FAT: ['Edit', 'Link', 'Power', 'Report', 'View History'],
    ATB: ['Edit', 'Link', 'Power', 'Report', 'View History'],
    DomeClosure: ['Edit', 'Link', 'Power', 'Report', 'View History'],
  };

  return actions[nodeType] || ['Edit', 'Link', 'Report'];
}

export interface QuickActionPayload {
  action: string;
  nodeId: string;
  nodeType: string;
  payload?: Record<string, any>;
}

export function createQuickActionPayload(
  action: string,
  nodeId: string,
  nodeType: string,
  payload?: Record<string, any>
): QuickActionPayload {
  return {
    action,
    nodeId,
    nodeType,
    payload,
  };
}

export function formatNodePanel(node: MapNode): {
  title: string;
  type: string;
  status: string;
  details: string[];
} {
  const powerStatus = node.powerIn ? (node.powerIn >= 0 ? 'High' : 'Low') : 'Unknown';

  return {
    title: node.name,
    type: node.type,
    status: powerStatus,
    details: [
      `ID: ${node.nodeId}`,
      `Coordinates: ${node.latitude.toFixed(4)}, ${node.longitude.toFixed(4)}`,
      `Power: ${node.powerIn?.toFixed(2) || 'N/A'} dBm`,
      `Last Update: ${node.lastUpdate ? new Date(node.lastUpdate).toLocaleTimeString() : 'N/A'}`,
    ],
  };
}
