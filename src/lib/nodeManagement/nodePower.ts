// Node Power Management Workflow

import { Node, PowerReading, SplitterInfo } from './types';

/**
 * Standard splitter loss values (dB)
 */
const SPLITTER_LOSSES: Record<string, number> = {
  '1:2': 3.5,
  '1:4': 7.0,
  '1:8': 10.0,
  '1:16': 13.0,
  '1:32': 16.0,
  '1:64': 19.0,
  '1:128': 22.0,
};

/**
 * Record manual power entry
 */
export function recordManualPowerEntry(
  node: Node,
  powerIn: number,
  notes?: string,
  technicianName: string = 'Unknown'
): Node {
  // Calculate power out and loss
  let powerOut = powerIn;
  let loss = 0;

  // Apply splitter loss if applicable
  if (node.type === 'Splitter' && node.splitterInfo) {
    loss = node.splitterInfo.typicalLoss;
    powerOut = powerIn - loss;
  }

  const reading: PowerReading = {
    powerIn,
    powerOut,
    loss,
    timestamp: new Date(),
    method: 'Manual',
    notes,
  };

  node.powerReadings.push(reading);
  node.currentPowerIn = powerIn;
  node.currentPowerOut = powerOut;
  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Record Bluetooth measurement (from OTDR/splicer device)
 */
export function recordBluetoothMeasurement(
  node: Node,
  measurement: {
    spliceLoss?: number;
    fiberId?: string;
    measurementType?: string;
    rawData?: any;
  },
  technicianName: string = 'Unknown'
): Node {
  const reading: PowerReading = {
    powerIn: node.currentPowerIn || 0,
    powerOut: node.currentPowerIn ? node.currentPowerIn - (measurement.spliceLoss || 0) : undefined,
    loss: measurement.spliceLoss || 0,
    timestamp: new Date(),
    method: 'Bluetooth',
    notes: `Bluetooth measurement: ${measurement.measurementType || 'unknown'}`,
  };

  node.powerReadings.push(reading);
  node.updatedAt = new Date();
  node.lastUpdatedBy = technicianName;
  node.synced = false;

  return node;
}

/**
 * Calculate power chain through network
 */
export function calculatePowerChain(
  nodes: Node[]
): Array<{ node: Node; powerIn: number; powerOut: number; cumulativeLoss: number }> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const powerChain: Array<{ node: Node; powerIn: number; powerOut: number; cumulativeLoss: number }> = [];

  // Find root nodes (OLTs with no parent)
  const rootNodes = nodes.filter(n => !n.parentNodeId && n.type === 'OLT');

  function traversePowerChain(node: Node, cumulativeLoss: number = 0): void {
    const powerIn = node.currentPowerIn || 0;
    const powerOut = node.currentPowerOut || powerIn - (node.powerReadings[0]?.loss || 0);
    const loss = powerIn - powerOut;

    powerChain.push({
      node,
      powerIn,
      powerOut,
      cumulativeLoss: cumulativeLoss + loss,
    });

    // Traverse children
    node.linkedNodes
      .filter(link => link.relationType === 'child')
      .forEach(link => {
        const childNode = nodeMap.get(link.nodeId);
        if (childNode) {
          traversePowerChain(childNode, cumulativeLoss + loss);
        }
      });
  }

  rootNodes.forEach(root => traversePowerChain(root));
  return powerChain;
}

/**
 * Get power alert status
 */
export function getPowerAlertStatus(node: Node): {
  status: 'ok' | 'warning' | 'critical';
  message: string;
} {
  if (!node.currentPowerIn) {
    return { status: 'warning', message: 'No power reading' };
  }

  // Critical if power is too low
  if (node.currentPowerIn < -20) {
    return { status: 'critical', message: 'Power too low' };
  }

  // Warning if power is marginal
  if (node.currentPowerIn < -15) {
    return { status: 'warning', message: 'Power marginal' };
  }

  // Check loss if we have power out
  if (node.currentPowerOut !== undefined) {
    const loss = node.currentPowerIn - node.currentPowerOut;

    // Critical if loss is too high
    if (loss > 20) {
      return { status: 'critical', message: `High loss: ${loss.toFixed(1)}dB` };
    }

    // Warning if loss is concerning
    if (loss > 15) {
      return { status: 'warning', message: `Elevated loss: ${loss.toFixed(1)}dB` };
    }
  }

  return { status: 'ok', message: 'Power levels normal' };
}

/**
 * Simulate power for entire network (for testing/planning)
 */
export function simulateNetworkPower(
  nodes: Node[],
  oltPowerIn: number = 3 // dBm
): Map<number, { powerIn: number; powerOut: number; loss: number }> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const simResults = new Map<number, { powerIn: number; powerOut: number; loss: number }>();

  // Find root OLT
  const olt = nodes.find(n => n.type === 'OLT' && !n.parentNodeId);
  if (!olt) {
    console.warn('No root OLT found for power simulation');
    return simResults;
  }

  function simulateBranch(node: Node, powerIn: number): void {
    let powerOut = powerIn;
    let loss = 0;

    // Calculate loss based on node type
    if (node.type === 'Splitter' && node.splitterInfo) {
      loss = node.splitterInfo.typicalLoss;
      powerOut = powerIn - loss;
    } else {
      loss = 1; // Default 1dB loss per component
      powerOut = powerIn - loss;
    }

    simResults.set(node.id, { powerIn, powerOut, loss });

    // Propagate to children
    node.linkedNodes
      .filter(link => link.relationType === 'child')
      .forEach(link => {
        const childNode = nodeMap.get(link.nodeId);
        if (childNode) {
          simulateBranch(childNode, powerOut);
        }
      });
  }

  simulateBranch(olt, oltPowerIn);
  return simResults;
}

/**
 * Get power statistics
 */
export function getPowerStatistics(nodes: Node[]): {
  avgPowerIn: number;
  avgPowerOut: number;
  avgLoss: number;
  maxLoss: number;
  minPower: number;
  maxPower: number;
  criticalNodes: Node[];
} {
  const powerReadings = nodes
    .flatMap(n => n.powerReadings)
    .filter(r => r.powerIn !== undefined);

  if (powerReadings.length === 0) {
    return {
      avgPowerIn: 0,
      avgPowerOut: 0,
      avgLoss: 0,
      maxLoss: 0,
      minPower: 0,
      maxPower: 0,
      criticalNodes: [],
    };
  }

  const powerIns = powerReadings.map(r => r.powerIn || 0);
  const powerOuts = powerReadings.map(r => r.powerOut || r.powerIn || 0);
  const losses = powerReadings.map(r => r.loss);

  const avgPowerIn = powerIns.reduce((a, b) => a + b, 0) / powerIns.length;
  const avgPowerOut = powerOuts.reduce((a, b) => a + b, 0) / powerOuts.length;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  const maxLoss = Math.max(...losses);
  const minPower = Math.min(...powerIns);
  const maxPower = Math.max(...powerIns);

  // Find critical nodes (low power or high loss)
  const criticalNodes = nodes.filter(n => {
    const alert = getPowerAlertStatus(n);
    return alert.status === 'critical';
  });

  return {
    avgPowerIn,
    avgPowerOut,
    avgLoss,
    maxLoss,
    minPower,
    maxPower,
    criticalNodes,
  };
}

/**
 * Export power report
 */
export function generatePowerReport(nodes: Node[]): string {
  const stats = getPowerStatistics(nodes);
  const powerChain = calculatePowerChain(nodes);

  let report = '=== FIBER NETWORK POWER REPORT ===\n\n';
  report += 'STATISTICS:\n';
  report += `Average Power In: ${stats.avgPowerIn.toFixed(2)} dBm\n`;
  report += `Average Power Out: ${stats.avgPowerOut.toFixed(2)} dBm\n`;
  report += `Average Loss: ${stats.avgLoss.toFixed(2)} dB\n`;
  report += `Maximum Loss: ${stats.maxLoss.toFixed(2)} dB\n`;
  report += `Min/Max Power: ${stats.minPower.toFixed(2)} / ${stats.maxPower.toFixed(2)} dBm\n\n`;

  report += 'POWER CHAIN:\n';
  powerChain.forEach((item, idx) => {
    report += `${idx + 1}. ${item.node.nodeId} (${item.node.type})\n`;
    report += `   Power In: ${item.powerIn.toFixed(2)} dBm\n`;
    report += `   Power Out: ${item.powerOut.toFixed(2)} dBm\n`;
    report += `   Cumulative Loss: ${item.cumulativeLoss.toFixed(2)} dB\n`;
  });

  if (stats.criticalNodes.length > 0) {
    report += '\nCRITICAL NODES:\n';
    stats.criticalNodes.forEach(node => {
      const alert = getPowerAlertStatus(node);
      report += `- ${node.nodeId}: ${alert.message}\n`;
    });
  }

  return report;
}
