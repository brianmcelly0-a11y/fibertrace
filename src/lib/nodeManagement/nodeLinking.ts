// Node Linking Workflow - Build Network Topology

import { Node, LinkedNode } from './types';

export interface LinkInput {
  parentNodeId: number;
  childNodeId: number;
  fiberSegment?: string;
  port?: number;
}

/**
 * Link node to parent node (build topology)
 * Examples: OLT → Splitter, Splitter → FAT, FAT → ATB, etc.
 */
export function linkNodes(
  parentNode: Node,
  childNode: Node,
  input: { fiberSegment?: string; port?: number },
  technicianName: string = 'Unknown'
): { parent: Node; child: Node } {
  const now = new Date();

  // Add child link to parent
  const parentLink: LinkedNode = {
    nodeId: childNode.id,
    relationType: 'child',
    fiberSegment: input.fiberSegment,
    port: input.port,
  };

  parentNode.linkedNodes.push(parentLink);
  parentNode.updatedAt = now;
  parentNode.lastUpdatedBy = technicianName;
  parentNode.synced = false;

  // Add parent link to child
  childNode.parentNodeId = parentNode.id;
  childNode.linkedNodes.push({
    nodeId: parentNode.id,
    relationType: 'parent',
  });
  childNode.updatedAt = now;
  childNode.lastUpdatedBy = technicianName;
  childNode.synced = false;

  // Record change
  parentNode.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'node_linked',
    oldValue: null,
    newValue: childNode.nodeId,
    changedBy: technicianName,
    timestamp: now,
    reason: input.fiberSegment ? `Linked via ${input.fiberSegment}` : 'Node linked',
  });

  return { parent: parentNode, child: childNode };
}

/**
 * Unlink nodes
 */
export function unlinkNodes(
  parentNode: Node,
  childNode: Node,
  technicianName: string = 'Unknown'
): { parent: Node; child: Node } {
  const now = new Date();

  // Remove from parent's children
  parentNode.linkedNodes = parentNode.linkedNodes.filter(
    link => link.nodeId !== childNode.id
  );

  // Remove from child's parent reference
  childNode.parentNodeId = undefined;
  childNode.linkedNodes = childNode.linkedNodes.filter(
    link => link.nodeId !== parentNode.id
  );

  parentNode.updatedAt = now;
  parentNode.lastUpdatedBy = technicianName;
  parentNode.synced = false;

  childNode.updatedAt = now;
  childNode.lastUpdatedBy = technicianName;
  childNode.synced = false;

  return { parent: parentNode, child: childNode };
}

/**
 * Get network topology tree structure
 */
export function buildNetworkTree(
  rootNode: Node,
  allNodes: Node[]
): any {
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  function buildNode(node: Node): any {
    const children = node.linkedNodes
      .filter(link => link.relationType === 'child')
      .map(link => {
        const childNode = nodeMap.get(link.nodeId);
        return childNode ? buildNode(childNode) : null;
      })
      .filter(Boolean);

    return {
      id: node.id,
      nodeId: node.nodeId,
      type: node.type,
      label: node.label,
      status: node.status,
      children,
    };
  }

  return buildNode(rootNode);
}

/**
 * Get full network path from OLT to a node
 */
export function getNetworkPath(
  targetNode: Node,
  allNodes: Node[]
): Node[] {
  const path: Node[] = [targetNode];
  let currentNode = targetNode;
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  while (currentNode.parentNodeId) {
    const parent = nodeMap.get(currentNode.parentNodeId);
    if (!parent) break;
    path.unshift(parent);
    currentNode = parent;
  }

  return path;
}

/**
 * Get all descendants of a node
 */
export function getNodeDescendants(
  node: Node,
  allNodes: Node[]
): Node[] {
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const descendants: Node[] = [];

  function traverse(currentNode: Node) {
    currentNode.linkedNodes
      .filter(link => link.relationType === 'child')
      .forEach(link => {
        const child = nodeMap.get(link.nodeId);
        if (child) {
          descendants.push(child);
          traverse(child);
        }
      });
  }

  traverse(node);
  return descendants;
}

/**
 * Get all siblings of a node
 */
export function getNodeSiblings(
  node: Node,
  allNodes: Node[]
): Node[] {
  if (!node.parentNodeId) return [];

  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const parent = nodeMap.get(node.parentNodeId);
  
  if (!parent) return [];

  return parent.linkedNodes
    .filter(link => link.relationType === 'child' && link.nodeId !== node.id)
    .map(link => nodeMap.get(link.nodeId))
    .filter(Boolean) as Node[];
}

/**
 * Validate topology (check for cycles, orphans, etc.)
 */
export function validateTopology(nodes: Node[]): {
  valid: boolean;
  orphans: Node[];
  cycles: Node[][];
  warnings: string[];
} {
  const orphans: Node[] = [];
  const cycles: Node[][] = [];
  const warnings: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Check for orphaned nodes (not connected to network)
  nodes.forEach(node => {
    if (!node.parentNodeId && node.linkedNodes.length === 0) {
      orphans.push(node);
      warnings.push(`Node ${node.nodeId} is isolated from network`);
    }
  });

  // Check for cycles
  const visited = new Set<number>();
  const recStack = new Set<number>();

  function hasCycle(nodeId: number, path: Node[]): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return false;

    for (const link of node.linkedNodes) {
      if (!visited.has(link.nodeId)) {
        if (hasCycle(link.nodeId, [...path, node])) {
          return true;
        }
      } else if (recStack.has(link.nodeId)) {
        cycles.push([...path, node]);
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      hasCycle(node.id, []);
    }
  });

  return {
    valid: orphans.length === 0 && cycles.length === 0,
    orphans,
    cycles,
    warnings,
  };
}

/**
 * Get network statistics
 */
export function getNetworkStats(nodes: Node[]): {
  totalNodes: number;
  connectedNodes: number;
  orphanedNodes: number;
  maxDepth: number;
  avgChildrenPerNode: number;
} {
  let connectedCount = 0;
  let orphanedCount = 0;
  let maxDepth = 0;
  let totalChildren = 0;

  nodes.forEach(node => {
    if (node.parentNodeId || node.linkedNodes.length > 0) {
      connectedCount++;
    } else {
      orphanedCount++;
    }

    const childCount = node.linkedNodes.filter(l => l.relationType === 'child').length;
    totalChildren += childCount;
  });

  // Calculate max depth
  nodes.forEach(node => {
    const path = getNetworkPath(node, nodes);
    maxDepth = Math.max(maxDepth, path.length);
  });

  return {
    totalNodes: nodes.length,
    connectedNodes: connectedCount,
    orphanedNodes: orphanedCount,
    maxDepth,
    avgChildrenPerNode: nodes.length > 0 ? totalChildren / nodes.length : 0,
  };
}
