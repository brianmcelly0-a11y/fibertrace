// Node Creation Workflow

import { Node, NodeType, NodeCondition, NodeCoordinates } from './types';

export interface CreateNodeInput {
  nodeType: NodeType;
  nodeId: string; // e.g., "FAT-021"
  label: string;
  coordinates: NodeCoordinates;
  powerLevel?: number;
  parentNodeId?: number;
  condition: NodeCondition;
  notes?: string;
  attachmentUrls?: string[];
}

/**
 * Create new node workflow
 * 1. Validate input
 * 2. Generate unique ID
 * 3. Initialize node with default values
 * 4. Save to database
 */
export function createNode(
  input: CreateNodeInput,
  technicianName: string
): Node {
  // Validate input
  if (!input.nodeType || !input.nodeId || !input.label) {
    throw new Error('Node type, ID, and label are required');
  }

  if (!input.coordinates || input.coordinates.latitude === undefined || input.coordinates.longitude === undefined) {
    throw new Error('Valid coordinates are required');
  }

  // Create node object
  const now = new Date();
  const node: Node = {
    id: Math.floor(Date.now() / 1000) + Math.random(), // Temporary ID, should be from backend
    nodeId: input.nodeId,
    type: input.nodeType,
    label: input.label,
    coordinates: input.coordinates,
    status: 'Unknown',
    condition: input.condition,
    
    // Power info
    powerReadings: input.powerLevel ? [{
      powerIn: input.powerLevel,
      loss: 0,
      timestamp: now,
      method: 'Manual',
      notes: input.notes,
    }] : [],
    currentPowerIn: input.powerLevel,
    
    // Network
    parentNodeId: input.parentNodeId,
    linkedNodes: [],
    
    // Attachments
    attachments: input.attachmentUrls?.map((url, idx) => ({
      id: `attach-${idx}`,
      type: 'photo',
      url,
      timestamp: now,
    })) || [],
    
    // Inventory
    inventoryUsed: [],
    
    // Metadata
    createdBy: technicianName,
    createdAt: now,
    updatedAt: now,
    lastUpdatedBy: technicianName,
    changeHistory: [{
      id: `ch-${Date.now()}`,
      fieldChanged: 'node_created',
      oldValue: null,
      newValue: input.nodeId,
      changedBy: technicianName,
      timestamp: now,
      reason: 'Node creation',
    }],
    
    synced: false,
  };

  return node;
}

/**
 * Batch create nodes
 */
export function createMultipleNodes(
  inputs: CreateNodeInput[],
  technicianName: string
): Node[] {
  return inputs.map(input => createNode(input, technicianName));
}

/**
 * Validate node ID uniqueness (should check against database)
 */
export function validateNodeIdUnique(nodeId: string, existingNodes: Node[]): boolean {
  return !existingNodes.some(node => node.nodeId === nodeId);
}

/**
 * Suggest next node ID based on pattern
 */
export function suggestNextNodeId(type: NodeType, existingNodes: Node[]): string {
  const prefix = type === 'FAT' ? 'FAT' 
                : type === 'ATB' ? 'ATB'
                : type === 'OLT' ? 'OLT'
                : type === 'Splitter' ? 'SPL'
                : type.substring(0, 3).toUpperCase();

  const nodesOfType = existingNodes.filter(n => n.type === type);
  const highestNum = Math.max(
    0,
    ...nodesOfType.map(n => {
      const match = n.nodeId.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })
  );

  const nextNum = (highestNum + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNum}`;
}

/**
 * Add photos to node
 */
export function addNodePhotos(node: Node, photoUrls: string[]): void {
  photoUrls.forEach((url, idx) => {
    node.attachments.push({
      id: `attach-${Date.now()}-${idx}`,
      type: 'photo',
      url,
      caption: `Photo ${node.attachments.length + 1}`,
      timestamp: new Date(),
    });
  });
}

/**
 * Initialize default splitter info
 */
export function initializeSplitterInfo(node: Node, splitterType: string): void {
  const typeMap: Record<string, number> = {
    '1:2': 2,
    '1:4': 4,
    '1:8': 8,
    '1:16': 16,
    '1:32': 32,
    '1:64': 64,
    '1:128': 128,
  };

  const typicalLossMap: Record<string, number> = {
    '1:2': 3.5,
    '1:4': 7,
    '1:8': 10,
    '1:16': 13,
    '1:32': 16,
    '1:64': 19,
    '1:128': 22,
  };

  const portCount = typeMap[splitterType] || 1;
  
  node.splitterInfo = {
    type: splitterType,
    portCount,
    typicalLoss: typicalLossMap[splitterType] || 3,
    connectedPorts: [],
  };
}

/**
 * Validate node data before saving
 */
export function validateNode(node: Node): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!node.nodeId || node.nodeId.trim() === '') {
    errors.push('Node ID is required');
  }

  if (!node.label || node.label.trim() === '') {
    errors.push('Node label is required');
  }

  if (node.coordinates.latitude < -90 || node.coordinates.latitude > 90) {
    errors.push('Invalid latitude');
  }

  if (node.coordinates.longitude < -180 || node.coordinates.longitude > 180) {
    errors.push('Invalid longitude');
  }

  if (node.type === 'Splitter' && !node.splitterInfo) {
    errors.push('Splitter info is required for Splitter nodes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
