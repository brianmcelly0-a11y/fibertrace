// Workflow 6: POWER MAPPING - Manual entry, Bluetooth updates, downstream propagation
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PowerReading, MapNode } from './types';

const POWER_STORAGE_KEY = 'map_power_readings';

export async function recordManualPowerEntry(
  nodeId: string,
  powerIn: number,
  splitterType?: string,
  technicianId?: string
): Promise<PowerReading> {
  const loss = calculatePowerLoss(powerIn, splitterType);
  const powerOut = powerIn - loss;

  const reading: PowerReading = {
    id: `power-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nodeId,
    powerIn,
    powerOut,
    loss,
    splitterType,
    method: 'manual',
    timestamp: Date.now(),
    technicianId,
  };

  await savePowerReading(reading);
  return reading;
}

export async function recordBluetoothMeasurement(
  nodeId: string,
  spliceLoss: number,
  fiberMeasurement: number,
  technicianId?: string
): Promise<PowerReading> {
  const reading: PowerReading = {
    id: `power-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nodeId,
    powerIn: fiberMeasurement,
    powerOut: fiberMeasurement - spliceLoss,
    loss: spliceLoss,
    method: 'bluetooth',
    timestamp: Date.now(),
    technicianId,
  };

  await savePowerReading(reading);
  return reading;
}

function calculatePowerLoss(powerIn: number, splitterType?: string): number {
  const splitterLoss: Record<string, number> = {
    '1:2': 3.1,
    '1:4': 7.2,
    '1:8': 10.1,
    '1:16': 13.2,
    '1:32': 16.2,
    '1:64': 19.1,
  };

  if (splitterType && splitterLoss[splitterType]) {
    return splitterLoss[splitterType];
  }

  return 0; // No splitter
}

export async function propagatePowerDownstream(
  nodeId: string,
  childNodeIds: string[],
  fiberLines: any[]
): Promise<PowerReading[]> {
  const readings: PowerReading[] = [];

  try {
    const stored = await AsyncStorage.getItem(POWER_STORAGE_KEY);
    const allReadings: PowerReading[] = stored ? JSON.parse(stored) : [];
    const parentReading = allReadings.find((r) => r.nodeId === nodeId);

    if (!parentReading) return readings;

    for (const childId of childNodeIds) {
      const reading = await recordManualPowerEntry(
        childId,
        parentReading.powerOut,
        undefined,
        parentReading.technicianId
      );
      readings.push(reading);
    }
  } catch (error) {
    console.error('Error propagating power downstream:', error);
  }

  return readings;
}

export async function savePowerReading(reading: PowerReading): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(POWER_STORAGE_KEY);
    const readings: PowerReading[] = stored ? JSON.parse(stored) : [];
    readings.push(reading);
    await AsyncStorage.setItem(POWER_STORAGE_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error('Error saving power reading:', error);
  }
}

export async function getPowerReadingsForNode(nodeId: string): Promise<PowerReading[]> {
  try {
    const stored = await AsyncStorage.getItem(POWER_STORAGE_KEY);
    const readings: PowerReading[] = stored ? JSON.parse(stored) : [];
    return readings.filter((r) => r.nodeId === nodeId).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting power readings:', error);
    return [];
  }
}

export function getPowerStatusColor(power: number): { color: string; status: string } {
  if (power >= 0) {
    return { color: '#10b981', status: 'High' };
  } else if (power >= -10) {
    return { color: '#f59e0b', status: 'Medium' };
  } else if (power >= -20) {
    return { color: '#f97316', status: 'Low' };
  } else {
    return { color: '#ef4444', status: 'Critical' };
  }
}
