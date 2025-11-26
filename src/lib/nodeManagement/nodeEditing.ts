// Node Edit Workflow

import { Node, NodeChangeHistory, NodeStatus, NodeCondition } from './types';

export interface NodeEditInput {
  fieldName: string;
  newValue: any;
  reason?: string;
  technicianName: string;
}

/**
 * Edit node field with change tracking
 */
export function editNode(
  node: Node,
  edits: NodeEditInput[]
): { updated: Node; changes: NodeChangeHistory[] } {
  const updatedNode = { ...node };
  const changes: NodeChangeHistory[] = [];
  const now = new Date();

  edits.forEach(edit => {
    const changeRecord: NodeChangeHistory = {
      id: `ch-${Date.now()}-${Math.random()}`,
      fieldChanged: edit.fieldName,
      oldValue: (updatedNode as any)[edit.fieldName],
      newValue: edit.newValue,
      changedBy: edit.technicianName,
      timestamp: now,
      reason: edit.reason,
    };

    // Apply the change
    (updatedNode as any)[edit.fieldName] = edit.newValue;
    changes.push(changeRecord);
  });

  // Update metadata
  updatedNode.updatedAt = now;
  updatedNode.lastUpdatedBy = edits[0]?.technicianName || 'Unknown';
  updatedNode.changeHistory.push(...changes);
  updatedNode.synced = false; // Mark for sync

  return { updated: updatedNode, changes };
}

/**
 * Update node type
 */
export function updateNodeType(
  node: Node,
  newType: string,
  reason: string,
  technicianName: string
): Node {
  const { updated } = editNode(node, [{
    fieldName: 'type',
    newValue: newType,
    reason,
    technicianName,
  }]);
  return updated;
}

/**
 * Update power reading
 */
export function updatePowerReading(
  node: Node,
  powerIn: number,
  powerOut?: number,
  method: 'Manual' | 'Bluetooth' | 'OTDR' = 'Manual',
  technicianName: string = 'Unknown'
): Node {
  const reading = {
    powerIn,
    powerOut,
    loss: (powerIn - (powerOut || powerIn)), // Simple loss calculation
    timestamp: new Date(),
    method,
  };

  node.powerReadings.push(reading);
  node.currentPowerIn = powerIn;
  if (powerOut !== undefined) {
    node.currentPowerOut = powerOut;
  }

  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Update splitter connections
 */
export function updateSplitterConnections(
  node: Node,
  portNumber: number,
  connectedNodeId?: number,
  technicianName: string = 'Unknown'
): Node {
  if (!node.splitterInfo) {
    throw new Error('This node is not a splitter');
  }

  if (portNumber < 1 || portNumber > node.splitterInfo.portCount) {
    throw new Error(`Invalid port number. Valid range: 1-${node.splitterInfo.portCount}`);
  }

  if (connectedNodeId) {
    if (!node.splitterInfo.connectedPorts.includes(portNumber)) {
      node.splitterInfo.connectedPorts.push(portNumber);
    }
  } else {
    node.splitterInfo.connectedPorts = node.splitterInfo.connectedPorts.filter(p => p !== portNumber);
  }

  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Update node coordinates
 */
export function updateCoordinates(
  node: Node,
  latitude: number,
  longitude: number,
  altitude?: number,
  accuracy?: number,
  technicianName: string = 'Unknown'
): Node {
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude');
  }

  node.coordinates = {
    latitude,
    longitude,
    altitude,
    accuracy,
  };

  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Update node condition
 */
export function updateCondition(
  node: Node,
  condition: NodeCondition,
  notes?: string,
  technicianName: string = 'Unknown'
): Node {
  node.condition = condition;
  if (notes) {
    node.maintenanceNotes = notes;
  }

  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Update node status
 */
export function updateStatus(
  node: Node,
  status: NodeStatus,
  reason?: string,
  technicianName: string = 'Unknown'
): Node {
  const { updated } = editNode(node, [{
    fieldName: 'status',
    newValue: status,
    reason,
    technicianName,
  }]);

  if (status === 'Completed') {
    updated.lastMaintenance = new Date();
  }

  return updated;
}

/**
 * Get change history for node
 */
export function getChangeHistory(node: Node): NodeChangeHistory[] {
  return node.changeHistory.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Revert to previous state (from change history)
 */
export function revertChange(
  node: Node,
  changeIndex: number,
  technicianName: string = 'Unknown'
): Node {
  const changeHistory = getChangeHistory(node);
  if (changeIndex < 0 || changeIndex >= changeHistory.length) {
    throw new Error('Invalid change index');
  }

  const changeToRevert = changeHistory[changeIndex];
  const { updated } = editNode(node, [{
    fieldName: changeToRevert.fieldChanged,
    newValue: changeToRevert.oldValue,
    reason: `Reverted: ${changeToRevert.reason}`,
    technicianName,
  }]);

  return updated;
}

/**
 * Track attachment changes
 */
export function validateNodeChanges(
  originalNode: Node,
  updatedNode: Node
): { hasChanges: boolean; changedFields: string[] } {
  const changedFields: string[] = [];

  if (originalNode.label !== updatedNode.label) changedFields.push('label');
  if (originalNode.type !== updatedNode.type) changedFields.push('type');
  if (originalNode.status !== updatedNode.status) changedFields.push('status');
  if (originalNode.condition !== updatedNode.condition) changedFields.push('condition');

  return {
    hasChanges: changedFields.length > 0,
    changedFields,
  };
}
