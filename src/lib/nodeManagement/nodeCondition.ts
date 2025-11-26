// Node Condition & Maintenance Workflow

import { Node, NodeStatus, NodeCondition, NodeAttachment } from './types';

/**
 * Update node condition
 */
export function updateNodeCondition(
  node: Node,
  condition: NodeCondition,
  details: {
    notes?: string;
    photoUrls?: string[];
    location?: string;
  },
  technicianName: string = 'Unknown'
): Node {
  const now = new Date();

  node.condition = condition;
  if (details.notes) {
    node.maintenanceNotes = details.notes;
  }

  // Add photos
  if (details.photoUrls) {
    details.photoUrls.forEach((url, idx) => {
      node.attachments.push({
        id: `maint-photo-${Date.now()}-${idx}`,
        type: 'photo',
        url,
        caption: `Condition photo: ${condition}`,
        timestamp: now,
      });
    });
  }

  node.updatedAt = now;
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Schedule maintenance
 */
export function scheduleMaintenanceAlert(
  node: Node,
  maintenanceType: 'inspection' | 'service' | 'repair' | 'replacement',
  notes: string,
  targetDate?: Date
): {
  node: Node;
  alert: {
    id: string;
    type: string;
    targetDate: Date;
    created: Date;
    note: string;
  };
} {
  const alert = {
    id: `alert-${Date.now()}`,
    type: maintenanceType,
    targetDate: targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
    created: new Date(),
    note: notes,
  };

  node.status = 'Needs Service';
  node.updatedAt = new Date();

  return { node, alert };
}

/**
 * Complete maintenance
 */
export function completeNodeMaintenance(
  node: Node,
  maintenanceNotes: string,
  photoUrls?: string[],
  technicianName: string = 'Unknown'
): Node {
  const now = new Date();

  node.status = 'Completed';
  node.condition = 'existing';
  node.lastMaintenance = now;
  node.maintenanceNotes = maintenanceNotes;

  if (photoUrls) {
    photoUrls.forEach((url, idx) => {
      node.attachments.push({
        id: `complete-photo-${Date.now()}-${idx}`,
        type: 'photo',
        url,
        caption: 'Post-maintenance photo',
        timestamp: now,
      });
    });
  }

  node.updatedAt = now;
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Get nodes requiring maintenance
 */
export function getNodesRequiringMaintenance(
  nodes: Node[]
): {
  urgent: Node[];
  scheduled: Node[];
  duForInspection: Node[];
} {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const urgent = nodes.filter(n => 
    n.condition === 'damaged' || 
    (n.status === 'Needs Service' && n.condition !== 'new')
  );

  const scheduled = nodes.filter(n => n.status === 'Under Maintenance');

  const duForInspection = nodes.filter(n => {
    if (n.lastMaintenance) {
      return n.lastMaintenance < sixtyDaysAgo;
    }
    return n.createdAt < thirtyDaysAgo;
  });

  return { urgent, scheduled, duForInspection };
}

/**
 * Add maintenance note
 */
export function addMaintenanceNote(
  node: Node,
  note: string,
  attachmentUrls?: string[],
  technicianName: string = 'Unknown'
): Node {
  const now = new Date();

  node.maintenanceNotes = (node.maintenanceNotes || '') + '\n' + `[${now.toLocaleString()}] ${technicianName}: ${note}`;

  if (attachmentUrls) {
    attachmentUrls.forEach((url, idx) => {
      node.attachments.push({
        id: `note-attach-${Date.now()}-${idx}`,
        type: 'document',
        url,
        caption: 'Maintenance note attachment',
        timestamp: now,
      });
    });
  }

  node.updatedAt = now;
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Get maintenance history for node
 */
export function getMaintenanceHistory(node: Node): Array<{
  date: Date;
  type: string;
  notes: string;
  photos: NodeAttachment[];
}> {
  const history: Array<{
    date: Date;
    type: string;
    notes: string;
    photos: NodeAttachment[];
  }> = [];

  node.changeHistory
    .filter(change => change.fieldChanged.includes('maintenance') || change.fieldChanged === 'status')
    .forEach(change => {
      if (change.fieldChanged === 'status' && change.newValue === 'Completed') {
        history.push({
          date: change.timestamp,
          type: 'maintenance_completed',
          notes: change.reason || '',
          photos: node.attachments.filter(a => 
            a.timestamp >= change.timestamp && 
            a.timestamp < new Date(change.timestamp.getTime() + 60000)
          ),
        });
      }
    });

  return history.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get condition trend for node
 */
export function getConditionTrend(
  node: Node
): Array<{ date: Date; condition: NodeCondition; status: NodeStatus }> {
  const trend: Array<{ date: Date; condition: NodeCondition; status: NodeStatus }> = [];

  // Initial state
  trend.push({
    date: node.createdAt,
    condition: 'new',
    status: 'Unknown',
  });

  // Add from change history
  node.changeHistory
    .filter(change => change.fieldChanged === 'condition' || change.fieldChanged === 'status')
    .forEach(change => {
      if (trend.length > 0) {
        const lastEntry = trend[trend.length - 1];
        trend.push({
          date: change.timestamp,
          condition: change.fieldChanged === 'condition' ? change.newValue : lastEntry.condition,
          status: change.fieldChanged === 'status' ? change.newValue : lastEntry.status,
        });
      }
    });

  return trend;
}

/**
 * Generate condition report
 */
export function generateConditionReport(nodes: Node[]): string {
  const { urgent, scheduled, duForInspection } = getNodesRequiringMaintenance(nodes);

  let report = '=== NODE CONDITION REPORT ===\n\n';

  report += `URGENT (${urgent.length}):\n`;
  urgent.forEach(n => {
    report += `- ${n.nodeId} (${n.type}): ${n.condition} - ${n.maintenanceNotes || 'No notes'}\n`;
  });

  report += `\nSCHEDULED (${scheduled.length}):\n`;
  scheduled.forEach(n => {
    report += `- ${n.nodeId} (${n.type}): Under maintenance\n`;
  });

  report += `\nDUE FOR INSPECTION (${duForInspection.length}):\n`;
  duForInspection.forEach(n => {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(n.lastMaintenance || n.createdAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    report += `- ${n.nodeId} (${n.type}): Last updated ${daysSinceUpdate} days ago\n`;
  });

  return report;
}
