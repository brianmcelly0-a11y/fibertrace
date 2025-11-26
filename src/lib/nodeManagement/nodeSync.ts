// Node Sync Workflow (Cloud)

import { Node } from './types';

export interface SyncStatus {
  isSyncing: boolean;
  unsyncedCount: number;
  lastSync: Date | null;
  syncErrors: string[];
  uploadedCount: number;
  downloadedCount: number;
}

/**
 * Prepare nodes for sync (get unsynced nodes)
 */
export function getUnsyncedNodes(nodes: Node[]): Node[] {
  return nodes.filter(n => !n.synced);
}

/**
 * Upload unsynced nodes to backend
 */
export async function uploadNodes(
  nodes: Node[],
  apiUrl: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  for (const node of nodes) {
    try {
      const response = await fetch(`${apiUrl}/api/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      success++;
    } catch (error) {
      errors.push(`Failed to upload node ${node.nodeId}: ${String(error)}`);
      failed++;
    }
  }

  return { success, failed, errors };
}

/**
 * Download latest node data from backend
 */
export async function downloadNodes(
  apiUrl: string
): Promise<{ nodes: Node[]; errors: string[] }> {
  const errors: string[] = [];
  let nodes: Node[] = [];

  try {
    const response = await fetch(`${apiUrl}/api/nodes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    nodes = await response.json();
  } catch (error) {
    errors.push(`Failed to download nodes: ${String(error)}`);
  }

  return { nodes, errors };
}

/**
 * Merge local and server versions using timestamps
 */
export function mergeNodeData(
  localNode: Node,
  serverNode: Partial<Node>
): Node {
  // Server data is newer, use it
  if (serverNode.updatedAt && new Date(serverNode.updatedAt) > localNode.updatedAt) {
    return { ...localNode, ...serverNode } as Node;
  }

  // Local is newer or same, keep local
  return localNode;
}

/**
 * Complete sync workflow
 */
export async function syncNodes(
  nodes: Node[],
  apiUrl: string,
  onProgress?: (status: SyncStatus) => void
): Promise<SyncStatus> {
  const syncStatus: SyncStatus = {
    isSyncing: true,
    unsyncedCount: getUnsyncedNodes(nodes).length,
    lastSync: null,
    syncErrors: [],
    uploadedCount: 0,
    downloadedCount: 0,
  };

  if (onProgress) onProgress(syncStatus);

  try {
    // Step 1: Upload unsynced nodes
    const unsyncedNodes = getUnsyncedNodes(nodes);
    if (unsyncedNodes.length > 0) {
      const uploadResult = await uploadNodes(unsyncedNodes, apiUrl);
      syncStatus.uploadedCount = uploadResult.success;
      syncStatus.syncErrors.push(...uploadResult.errors);
    }

    // Step 2: Download latest data
    const downloadResult = await downloadNodes(apiUrl);
    syncStatus.downloadedCount = downloadResult.nodes.length;
    syncStatus.syncErrors.push(...downloadResult.errors);

    // Step 3: Merge and update
    downloadResult.nodes.forEach(serverNode => {
      const localNodeIndex = nodes.findIndex(n => n.id === serverNode.id);
      if (localNodeIndex >= 0) {
        nodes[localNodeIndex] = mergeNodeData(nodes[localNodeIndex], serverNode);
      } else {
        nodes.push(serverNode as Node);
      }
    });

    // Mark synced
    unsyncedNodes.forEach(node => {
      node.synced = true;
      node.syncedAt = new Date();
    });

    syncStatus.lastSync = new Date();
    syncStatus.isSyncing = false;
    syncStatus.unsyncedCount = 0;
  } catch (error) {
    syncStatus.syncErrors.push(`Sync failed: ${String(error)}`);
    syncStatus.isSyncing = false;
  }

  if (onProgress) onProgress(syncStatus);

  return syncStatus;
}

/**
 * Handle sync conflicts
 */
export function resolveConflict(
  localNode: Node,
  serverNode: Node,
  strategy: 'local' | 'server' | 'merge' = 'merge'
): Node {
  switch (strategy) {
    case 'local':
      return localNode;
    case 'server':
      return serverNode;
    case 'merge':
    default:
      // Merge: take newer data for each field
      const merged = { ...serverNode };
      
      // Local power readings might be newer
      if (localNode.powerReadings.length > serverNode.powerReadings.length) {
        merged.powerReadings = localNode.powerReadings;
      }

      // Local inventory might be more current
      if (localNode.inventoryUsed.length > serverNode.inventoryUsed.length) {
        merged.inventoryUsed = localNode.inventoryUsed;
      }

      // Use newer timestamp
      if (new Date(localNode.updatedAt) > new Date(serverNode.updatedAt)) {
        merged.updatedAt = localNode.updatedAt;
        merged.lastUpdatedBy = localNode.lastUpdatedBy;
      }

      return merged;
  }
}

/**
 * Batch sync multiple node datasets
 */
export async function batchSyncNodes(
  nodeGroups: Node[][],
  apiUrl: string
): Promise<SyncStatus[]> {
  return Promise.all(
    nodeGroups.map(nodes => syncNodes(nodes, apiUrl))
  );
}

/**
 * Generate sync report
 */
export function generateSyncReport(statuses: SyncStatus[]): string {
  let report = '=== NODE SYNC REPORT ===\n\n';

  const totalUploaded = statuses.reduce((sum, s) => sum + s.uploadedCount, 0);
  const totalDownloaded = statuses.reduce((sum, s) => sum + s.downloadedCount, 0);
  const totalErrors = statuses.reduce((sum, s) => sum + s.syncErrors.length, 0);

  report += `Total Uploaded: ${totalUploaded}\n`;
  report += `Total Downloaded: ${totalDownloaded}\n`;
  report += `Total Errors: ${totalErrors}\n\n`;

  if (totalErrors > 0) {
    report += 'ERRORS:\n';
    statuses.forEach((status, idx) => {
      status.syncErrors.forEach(error => {
        report += `- Batch ${idx + 1}: ${error}\n`;
      });
    });
  }

  const lastSync = statuses
    .map(s => s.lastSync)
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  report += `\nLast Sync: ${lastSync?.toLocaleString() || 'Never'}\n`;

  return report;
}
