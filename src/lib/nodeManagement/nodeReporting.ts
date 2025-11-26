// Node Reporting Workflow

import { Node, NodeReport } from './types';
import { calculatePowerChain, getPowerStatistics, generatePowerReport } from './nodePower';
import { generateConditionReport } from './nodeCondition';
import { generateInventoryUsageReport } from './nodeInventory';
import { getNetworkStats } from './nodeLinking';

/**
 * Generate daily summary report
 */
export function generateDailySummaryReport(
  nodes: Node[],
  technicianName: string,
  location: { latitude: number; longitude: number }
): NodeReport {
  const now = new Date();

  return {
    id: `report-${Date.now()}`,
    nodeId: 0,
    nodeLabel: 'Daily Summary',
    type: 'daily_summary',
    nodeDetails: {},
    powerChain: calculatePowerChain(nodes).map(item => item.node.powerReadings[0] || {
      powerIn: 0,
      loss: 0,
      timestamp: now,
      method: 'Manual',
    }),
    connectivityChain: [],
    spliceLosses: nodes.flatMap(n => n.powerReadings.filter(r => r.method === 'Bluetooth')),
    attachments: nodes.flatMap(n => n.attachments),
    inventoryUsed: nodes.flatMap(n => n.inventoryUsed),
    technician: technicianName,
    gpsLocation: location,
    generatedAt: now,
  };
}

/**
 * Generate detailed node report
 */
export function generateNodeDetailedReport(
  node: Node,
  allNodes: Node[]
): NodeReport {
  return {
    id: `report-${Date.now()}`,
    nodeId: node.id,
    nodeLabel: node.nodeId,
    type: 'node_detailed',
    nodeDetails: node,
    powerChain: node.powerReadings,
    connectivityChain: node.linkedNodes,
    spliceLosses: node.powerReadings.filter(r => r.method === 'Bluetooth'),
    attachments: node.attachments,
    inventoryUsed: node.inventoryUsed,
    technician: node.lastUpdatedBy,
    gpsLocation: node.coordinates,
    generatedAt: new Date(),
  };
}

/**
 * Generate job-based report (all nodes involved in a job)
 */
export function generateJobBasedReport(
  jobNodeIds: number[],
  nodes: Node[],
  jobLabel: string
): NodeReport {
  const jobNodes = nodes.filter(n => jobNodeIds.includes(n.id));
  const now = new Date();

  return {
    id: `report-${Date.now()}`,
    nodeId: 0,
    nodeLabel: jobLabel,
    type: 'job_based',
    nodeDetails: { nodes: jobNodes },
    powerChain: calculatePowerChain(jobNodes).map(item => ({
      powerIn: item.powerIn,
      powerOut: item.powerOut,
      loss: item.powerOut ? item.powerIn - item.powerOut : 0,
      timestamp: now,
      method: 'Manual',
    })),
    connectivityChain: jobNodes.flatMap(n => n.linkedNodes),
    spliceLosses: jobNodes.flatMap(n => n.powerReadings.filter(r => r.method === 'Bluetooth')),
    attachments: jobNodes.flatMap(n => n.attachments),
    inventoryUsed: jobNodes.flatMap(n => n.inventoryUsed),
    technician: jobNodes[0]?.lastUpdatedBy || 'Unknown',
    gpsLocation: jobNodes[0]?.coordinates || { latitude: 0, longitude: 0 },
    generatedAt: now,
  };
}

/**
 * Generate fault summary report (nodes with issues)
 */
export function generateFaultSummaryReport(
  nodes: Node[]
): NodeReport {
  const faultyNodes = nodes.filter(n => 
    n.status !== 'OK' || 
    n.condition === 'damaged' ||
    (n.powerReadings.length > 0 && n.powerReadings[n.powerReadings.length - 1].loss > 15)
  );
  const now = new Date();

  return {
    id: `report-${Date.now()}`,
    nodeId: 0,
    nodeLabel: 'Fault Summary',
    type: 'fault_summary',
    nodeDetails: { faultyNodes },
    powerChain: faultyNodes.flatMap(n => n.powerReadings),
    connectivityChain: faultyNodes.flatMap(n => n.linkedNodes),
    spliceLosses: faultyNodes.flatMap(n => n.powerReadings.filter(r => r.method === 'Bluetooth')),
    attachments: faultyNodes.flatMap(n => n.attachments),
    inventoryUsed: faultyNodes.flatMap(n => n.inventoryUsed),
    technician: faultyNodes[0]?.lastUpdatedBy || 'Unknown',
    gpsLocation: faultyNodes[0]?.coordinates || { latitude: 0, longitude: 0 },
    generatedAt: now,
  };
}

/**
 * Export report to PDF format (returns JSON structure ready for PDF conversion)
 */
export function exportReportPDF(report: NodeReport): {
  title: string;
  sections: Array<{ heading: string; content: string | string[] }>;
  generatedAt: string;
  technician: string;
} {
  const sections: Array<{ heading: string; content: string | string[] }> = [];

  sections.push({
    heading: 'Report Information',
    content: [
      `Type: ${report.type}`,
      `Generated: ${report.generatedAt.toLocaleString()}`,
      `Technician: ${report.technician}`,
      `Location: ${report.gpsLocation.latitude.toFixed(4)}, ${report.gpsLocation.longitude.toFixed(4)}`,
    ],
  });

  if (report.nodeDetails && Object.keys(report.nodeDetails).length > 0) {
    sections.push({
      heading: 'Node Details',
      content: JSON.stringify(report.nodeDetails, null, 2),
    });
  }

  if (report.powerChain.length > 0) {
    sections.push({
      heading: 'Power Chain',
      content: report.powerChain.map(r => 
        `In: ${r.powerIn}dBm → Out: ${r.powerOut || 'N/A'}dBm (Loss: ${r.loss}dB)`
      ),
    });
  }

  if (report.inventoryUsed.length > 0) {
    sections.push({
      heading: 'Inventory Used',
      content: report.inventoryUsed.map(i => `${i.itemName}: ${i.quantity} units`),
    });
  }

  if (report.attachments.length > 0) {
    sections.push({
      heading: 'Attachments',
      content: report.attachments.map(a => `${a.type}: ${a.caption || a.url}`),
    });
  }

  return {
    title: `${report.type.replace(/_/g, ' ').toUpperCase()} - ${report.nodeLabel}`,
    sections,
    generatedAt: report.generatedAt.toISOString(),
    technician: report.technician,
  };
}

/**
 * Export report to JSON
 */
export function exportReportJSON(report: NodeReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export report to CSV
 */
export function exportReportCSV(report: NodeReport): string {
  let csv = 'Node Management Report\n';
  csv += `Type,${report.type}\n`;
  csv += `Generated,${report.generatedAt.toISOString()}\n`;
  csv += `Technician,${report.technician}\n\n`;

  csv += 'Power Readings\n';
  csv += 'Power In (dBm),Power Out (dBm),Loss (dB),Timestamp,Method\n';
  report.powerChain.forEach(r => {
    csv += `${r.powerIn},${r.powerOut || ''},${r.loss},${r.timestamp.toISOString()},${r.method}\n`;
  });

  csv += '\nInventory Used\n';
  csv += 'Item,Quantity,Condition,Timestamp\n';
  report.inventoryUsed.forEach(i => {
    csv += `${i.itemName},${i.quantity},${i.condition || ''},${i.timestamp.toISOString()}\n`;
  });

  return csv;
}

/**
 * Generate network statistics report
 */
export function generateNetworkStatsReport(nodes: Node[]): string {
  const stats = getNetworkStats(nodes);
  const powerStats = getPowerStatistics(nodes);

  let report = '=== NETWORK STATISTICS REPORT ===\n\n';

  report += 'TOPOLOGY:\n';
  report += `Total Nodes: ${stats.totalNodes}\n`;
  report += `Connected Nodes: ${stats.connectedNodes}\n`;
  report += `Orphaned Nodes: ${stats.orphanedNodes}\n`;
  report += `Max Depth: ${stats.maxDepth}\n`;
  report += `Avg Children per Node: ${stats.avgChildrenPerNode.toFixed(2)}\n\n`;

  report += 'POWER:\n';
  report += `Average Power In: ${powerStats.avgPowerIn.toFixed(2)} dBm\n`;
  report += `Average Loss: ${powerStats.avgLoss.toFixed(2)} dB\n`;
  report += `Max Loss: ${powerStats.maxLoss.toFixed(2)} dB\n`;
  report += `Critical Nodes: ${powerStats.criticalNodes.length}\n`;

  return report;
}
