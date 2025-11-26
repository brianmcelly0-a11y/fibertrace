// Node Management Module - Main Export

// Types
export * from './types';

// Workflows
export * from './nodeLoading';
export * from './nodeCreation';
export * from './nodeEditing';
export * from './nodeLinking';
export * from './nodePower';
export * from './nodeCondition';
export * from './nodeInventory';
export * from './nodeReporting';
export * from './nodeSync';

// Common inventory items
export { COMMON_INVENTORY_ITEMS } from './nodeInventory';

// Convenience exports for common operations
export {
  loadNodeDatabase,
  classifyNodesByType,
  getNodeStats,
  filterNodes,
  searchNodes,
} from './nodeLoading';

export {
  createNode,
  createMultipleNodes,
  validateNodeIdUnique,
  suggestNextNodeId,
} from './nodeCreation';

export {
  editNode,
  updateNodeType,
  updatePowerReading,
  updateSplitterConnections,
  updateCoordinates,
  updateCondition,
  updateStatus,
} from './nodeEditing';

export {
  linkNodes,
  unlinkNodes,
  buildNetworkTree,
  getNetworkPath,
  getNodeDescendants,
  getNodeSiblings,
  validateTopology,
  getNetworkStats,
} from './nodeLinking';

export {
  recordManualPowerEntry,
  recordBluetoothMeasurement,
  calculatePowerChain,
  getPowerAlertStatus,
  getPowerStatistics,
  generatePowerReport,
} from './nodePower';

export {
  updateNodeCondition,
  scheduleMaintenanceAlert,
  completeNodeMaintenance,
  getNodesRequiringMaintenance,
  addMaintenanceNote,
  getMaintenanceHistory,
} from './nodeCondition';

export {
  addInventoryUsage,
  getInventorySummary,
  generateInventoryReport,
  estimateInventoryForJob,
  categorizeInventoryCondition,
  generateInventoryUsageReport,
} from './nodeInventory';

export {
  generateDailySummaryReport,
  generateNodeDetailedReport,
  generateJobBasedReport,
  generateFaultSummaryReport,
  exportReportPDF,
  exportReportJSON,
  exportReportCSV,
  generateNetworkStatsReport,
} from './nodeReporting';

export {
  getUnsyncedNodes,
  uploadNodes,
  downloadNodes,
  mergeNodeData,
  syncNodes,
  resolveConflict,
  batchSyncNodes,
  generateSyncReport,
} from './nodeSync';
