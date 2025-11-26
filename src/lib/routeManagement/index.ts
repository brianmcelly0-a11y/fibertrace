// Fiber Route Management Module - Main Export

// Types
export * from './types';

// Workflows
export * from './routeLoading';
export * from './routeCreation';
export * from './routeDistance';
export * from './routeLinking';
export * from './routeCondition';
export * from './routeInventory';

// Convenience exports for common operations
export {
  loadRouteDatabase,
  getRouteColor,
  getStatusColor,
  formatRouteForMap,
  classifyRoutesByType,
  getRouteStats,
  filterRoutes,
  searchRoutes,
  sortRoutes,
  getRoutesByFaultStatus,
  getRoutesForNode,
} from './routeLoading';

export {
  createRouteFromGPSPath,
  createRouteFromMapPoints,
  suggestNextRouteId,
  validateRoute,
  addRoutePhotos,
} from './routeCreation';

export {
  calculateDistance,
  calculateBearing,
  calculateTotalRouteDistance,
  getSegmentDistances,
  compareDistances,
  overrideRouteDistance,
  addReserveLength,
  getCableMetrics,
  estimateMaterials,
} from './routeDistance';

export {
  autoLinkRoute,
  relinkStartNode,
  relinkEndNode,
  splitRoute,
  getConnectedRoutes,
  getRoutesForNode as getRoutesForNodeLinking,
  getNetworkPath,
  validateRouteLinking,
} from './routeLinking';

export {
  reportFault,
  resolveFault,
  getActiveFaults,
  getResolvedFaults,
  getFaultsBySeverity,
  startMaintenance,
  completeMaintenance,
  getRoutesWithActiveFaults,
  generateFaultReport,
  getMaintenanceHistory,
} from './routeCondition';

export {
  getCableUsage,
  updateCableInventory,
  getMaterialsForRoute,
  estimateRouteCost,
  generateInventoryReport,
  getSpliceInfo,
} from './routeInventory';
