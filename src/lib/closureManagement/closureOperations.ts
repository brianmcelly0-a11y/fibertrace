import { Closure, Splice, MaintenanceRecord, ClosureStatus, ClosureType, LocationType, ClosureStats } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fibertrace_closures';

export async function loadClosures(): Promise<Closure[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load closures:', error);
    return [];
  }
}

export async function saveClosures(closures: Closure[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(closures));
  } catch (error) {
    console.error('Failed to save closures:', error);
  }
}

export function createClosure(data: Omit<Closure, 'id' | 'createdAt' | 'updatedAt'>, technicianId: string): Closure {
  return {
    ...data,
    id: `closure-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: technicianId,
    maintenanceHistory: [],
    synced: false,
  };
}

export async function addClosure(closure: Closure): Promise<void> {
  const closures = await loadClosures();
  closures.push(closure);
  await saveClosures(closures);
}

export async function updateClosure(closureId: string, updates: Partial<Closure>): Promise<void> {
  const closures = await loadClosures();
  const index = closures.findIndex(c => c.id === closureId);
  if (index !== -1) {
    closures[index] = { ...closures[index], ...updates, updatedAt: new Date().toISOString() };
    await saveClosures(closures);
  }
}

export async function addSplice(closureId: string, splice: Splice): Promise<void> {
  const closures = await loadClosures();
  const closure = closures.find(c => c.id === closureId);
  if (closure) {
    closure.splices.push(splice);
    closure.updatedAt = new Date().toISOString();
    await saveClosures(closures);
  }
}

export async function addMaintenanceRecord(closureId: string, record: MaintenanceRecord): Promise<void> {
  const closures = await loadClosures();
  const closure = closures.find(c => c.id === closureId);
  if (closure) {
    closure.maintenanceHistory.push(record);
    closure.updatedAt = new Date().toISOString();
    await saveClosures(closures);
  }
}

export function calculateSpliceLoss(splices: Splice[]): number {
  if (splices.length === 0) return 0;
  const totalLoss = splices.reduce((sum, splice) => sum + splice.lossReading, 0);
  return totalLoss / splices.length;
}

export function getClosureStats(closures: Closure[]): ClosureStats {
  const byType: Record<ClosureType, number> = {
    ATB: 0,
    FAT: 0,
    Dome: 0,
    Inline: 0,
    PatchPanel: 0,
    SplitterBox: 0,
    DistributionPoint: 0,
  };

  closures.forEach(c => {
    byType[c.type] = (byType[c.type] || 0) + 1;
  });

  const totalSplices = closures.reduce((sum, c) => sum + c.splices.length, 0);
  const closuresWithHighLoss = closures.filter(c => calculateSpliceLoss(c.splices) > 0.5).length;

  return {
    totalClosures: closures.length,
    byType,
    activeClosures: closures.filter(c => c.status === 'Active').length,
    totalSplices,
    averageSpicesPerClosure: closures.length > 0 ? totalSplices / closures.length : 0,
    closuresWithHighLoss,
  };
}

export async function getClosuresByRoute(routeId: string): Promise<Closure[]> {
  const closures = await loadClosures();
  return closures.filter(c => c.routeIds.includes(routeId));
}

export async function getClosuresByType(type: ClosureType): Promise<Closure[]> {
  const closures = await loadClosures();
  return closures.filter(c => c.type === type);
}

export async function searchClosures(query: string): Promise<Closure[]> {
  const closures = await loadClosures();
  const lowerQuery = query.toLowerCase();
  return closures.filter(c =>
    c.closureId.toLowerCase().includes(lowerQuery) ||
    c.label.toLowerCase().includes(lowerQuery) ||
    c.notes.toLowerCase().includes(lowerQuery)
  );
}

export function getPowerImpact(closure: Closure): { inputToPower: number; powerLoss: number } {
  const spliceLoss = calculateSpliceLoss(closure.splices);
  const estimatedLoss = spliceLoss + (closure.splices.length > 0 ? 0.2 : 0);
  return {
    inputToPower: closure.powerInput || 0,
    powerLoss: estimatedLoss,
  };
}

export async function generateClosureSummaryReport(closureId: string): Promise<string> {
  const closures = await loadClosures();
  const closure = closures.find(c => c.id === closureId);
  if (!closure) return '';

  const spliceLoss = calculateSpliceLoss(closure.splices);
  const powerImpact = getPowerImpact(closure);

  return `
Closure Summary Report
Type: ${closure.type}
ID: ${closure.closureId}
Label: ${closure.label}
Status: ${closure.status}

Fiber Configuration:
- Total Fibers: ${closure.fiberCount}
- Total Splices: ${closure.splices.length}
- Average Splice Loss: ${spliceLoss.toFixed(2)} dB

Power Analysis:
- Input Power: ${powerImpact.inputToPower} dBm
- Estimated Loss: ${powerImpact.powerLoss.toFixed(2)} dB

Location: ${closure.locationType}
Coordinates: ${closure.latitude}, ${closure.longitude}

Maintenance History: ${closure.maintenanceHistory.length} records

Notes: ${closure.notes}
  `.trim();
}
