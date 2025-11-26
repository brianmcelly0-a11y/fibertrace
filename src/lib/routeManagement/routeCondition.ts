// Route Condition & Maintenance Workflow

import { Route, RouteFault, FaultType } from './types';

/**
 * Report fault on route segment
 */
export function reportFault(
  route: Route,
  segmentId: string,
  faultType: FaultType,
  description: string,
  photoUrls: string[],
  severity: 'critical' | 'high' | 'medium' | 'low',
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();

  const fault: RouteFault = {
    id: `fault-${Date.now()}`,
    segmentId,
    type: faultType,
    reportedAt: now,
    reportedBy: technicianName,
    description,
    attachments: photoUrls,
    severity,
    resolved: false,
  };

  route.faults.push(fault);

  // Mark segment as faulty
  const segment = route.segments.find(s => s.id === segmentId);
  if (segment) {
    segment.status = 'faulty';
  }

  route.status = 'Faulty';
  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Mark fault as resolved/repaired
 */
export function resolveFault(
  route: Route,
  faultId: string,
  repairNotes: string,
  repairPhotoUrls: string[],
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();
  const fault = route.faults.find(f => f.id === faultId);

  if (!fault) {
    throw new Error('Fault not found');
  }

  fault.resolved = true;
  fault.resolvedAt = now;
  fault.repairNotes = repairNotes;
  fault.repairAttachments = repairPhotoUrls;

  // Mark segment back to normal
  const segment = route.segments.find(s => s.id === fault.segmentId);
  if (segment) {
    segment.status = 'normal';
  }

  // Update route status if all faults resolved
  const hasActiveFaults = route.faults.some(f => !f.resolved);
  if (!hasActiveFaults) {
    route.status = 'Completed';
  }

  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  return route;
}

/**
 * Get active faults for route
 */
export function getActiveFaults(route: Route): RouteFault[] {
  return route.faults.filter(f => !f.resolved);
}

/**
 * Get resolved faults for route
 */
export function getResolvedFaults(route: Route): RouteFault[] {
  return route.faults.filter(f => f.resolved);
}

/**
 * Get faults by severity
 */
export function getFaultsBySeverity(
  route: Route
): Record<'critical' | 'high' | 'medium' | 'low', RouteFault[]> {
  return {
    critical: route.faults.filter(f => f.severity === 'critical' && !f.resolved),
    high: route.faults.filter(f => f.severity === 'high' && !f.resolved),
    medium: route.faults.filter(f => f.severity === 'medium' && !f.resolved),
    low: route.faults.filter(f => f.severity === 'low' && !f.resolved),
  };
}

/**
 * Update route status to "Under Maintenance"
 */
export function startMaintenance(
  route: Route,
  maintenanceNotes: string,
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();

  route.status = 'Under Construction';
  route.notes = maintenanceNotes;
  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'status',
    oldValue: 'Faulty',
    newValue: 'Under Construction',
    changedBy: technicianName,
    timestamp: now,
    reason: 'Maintenance started',
  });

  return route;
}

/**
 * Mark route maintenance as completed
 */
export function completeMaintenance(
  route: Route,
  completionNotes: string,
  photoUrls: string[],
  technicianName: string = 'Unknown'
): Route {
  const now = new Date();

  // Add completion photos
  photoUrls.forEach((url, idx) => {
    route.attachments.push({
      id: `attach-completion-${Date.now()}-${idx}`,
      type: 'photo',
      url,
      caption: 'Post-maintenance photo',
      timestamp: now,
    });
  });

  route.status = 'Completed';
  route.notes = completionNotes;
  route.updatedAt = now;
  route.lastUpdatedBy = technicianName;
  route.synced = false;

  // Mark all segments as normal
  route.segments.forEach(segment => {
    segment.status = 'normal';
  });

  route.changeHistory.push({
    id: `ch-${Date.now()}`,
    fieldChanged: 'status',
    oldValue: 'Under Construction',
    newValue: 'Completed',
    changedBy: technicianName,
    timestamp: now,
    reason: 'Maintenance completed',
  });

  return route;
}

/**
 * Get routes with active faults
 */
export function getRoutesWithActiveFaults(routes: Route[]): Route[] {
  return routes.filter(route => route.faults.some(f => !f.resolved));
}

/**
 * Generate fault report
 */
export function generateFaultReport(routes: Route[]): string {
  let report = '=== ROUTE FAULT REPORT ===\n\n';

  const totalFaults = routes.reduce((sum, r) => sum + r.faults.length, 0);
  const activeFaults = routes.reduce((sum, r) => sum + getActiveFaults(r).length, 0);
  const resolvedFaults = totalFaults - activeFaults;

  report += `Total Faults: ${totalFaults}\n`;
  report += `Active: ${activeFaults}\n`;
  report += `Resolved: ${resolvedFaults}\n\n`;

  report += 'ROUTES WITH ACTIVE FAULTS:\n';
  routes.forEach(route => {
    const activeFaultsForRoute = getActiveFaults(route);
    if (activeFaultsForRoute.length > 0) {
      report += `\n${route.name}:\n`;
      activeFaultsForRoute.forEach(fault => {
        report += `  - ${fault.type} (${fault.severity}): ${fault.description}\n`;
        report += `    Reported: ${fault.reportedAt.toLocaleDateString()}\n`;
      });
    }
  });

  return report;
}

/**
 * Get maintenance history for route
 */
export function getMaintenanceHistory(
  route: Route
): Array<{ date: Date; action: string; notes: string }> {
  const history: Array<{ date: Date; action: string; notes: string }> = [];

  route.changeHistory
    .filter(ch => ch.fieldChanged === 'status')
    .forEach(change => {
      history.push({
        date: change.timestamp,
        action: `${change.oldValue} → ${change.newValue}`,
        notes: change.reason || '',
      });
    });

  return history.sort((a, b) => b.date.getTime() - a.date.getTime());
}
