import { SpliceMap, SpliceStatistics } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fibertrace_splice_maps';

export async function loadSpliceMaps(): Promise<SpliceMap[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load splice maps:', error);
    return [];
  }
}

export async function saveSpliceMaps(maps: SpliceMap[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (error) {
    console.error('Failed to save splice maps:', error);
  }
}

export function createSpliceMap(data: Omit<SpliceMap, 'id' | 'timestamp'>, technicianId: string): SpliceMap {
  return {
    ...data,
    id: `splice-${Date.now()}`,
    timestamp: new Date().toISOString(),
    technicianId,
  };
}

export async function addSpliceMap(map: SpliceMap): Promise<void> {
  const maps = await loadSpliceMaps();
  maps.push(map);
  await saveSpliceMaps(maps);
}

export function calculateSpliceStatistics(map: SpliceMap): SpliceStatistics {
  const mappings = map.fiberMappings;
  const totalSplices = mappings.length;
  const avgLoss = mappings.reduce((sum, m) => sum + m.lossReading, 0) / totalSplices;
  const highLossCount = mappings.filter(m => m.lossReading > 0.5).length;
  const faultCount = mappings.filter(m => m.status === 'Broken').length;
  const goodCount = mappings.filter(m => m.status === 'Good').length;

  return {
    totalSplices,
    avgLoss,
    highLossCount,
    faultCount,
    goodCount,
  };
}

export async function getSplicesByClosureId(closureId: string): Promise<SpliceMap[]> {
  const maps = await loadSpliceMaps();
  return maps.filter(m => m.closureId === closureId);
}

export async function identifyProblematicFibers(closureId: string): Promise<number[]> {
  const maps = await loadSpliceMaps();
  const closureMaps = maps.filter(m => m.closureId === closureId);
  const problematicFibers: Set<number> = new Set();

  closureMaps.forEach(map => {
    map.fiberMappings.forEach(mapping => {
      if (mapping.status === 'Broken' || mapping.lossReading > 0.8) {
        problematicFibers.add(mapping.inFiber);
        problematicFibers.add(mapping.outFiber);
      }
    });
  });

  return Array.from(problematicFibers);
}

export function generateVirtualSpliceVisualization(map: SpliceMap): string {
  let visualization = `\nSplice Map: ${map.id}\n`;
  visualization += `Cable In: ${map.cableInId} → Cable Out: ${map.cableOutId}\n`;
  visualization += `─`.repeat(50) + '\n';

  map.fiberMappings.forEach(mapping => {
    const icon = mapping.status === 'Good' ? '✓' : mapping.status === 'High-Loss' ? '⚠' : '✗';
    visualization += `${icon} Fiber ${mapping.inFiber} → ${mapping.outFiber}: ${mapping.lossReading.toFixed(2)} dB (${mapping.status})\n`;
  });

  const stats = calculateSpliceStatistics(map);
  visualization += `─`.repeat(50) + '\n';
  visualization += `Summary: Good: ${stats.goodCount} | High-Loss: ${stats.highLossCount} | Faults: ${stats.faultCount} | Avg Loss: ${stats.avgLoss.toFixed(2)} dB\n`;

  return visualization;
}

export async function generateSpliceReport(closureId: string): Promise<string> {
  const maps = await loadSpliceMaps();
  const closureMaps = maps.filter(m => m.closureId === closureId);

  if (closureMaps.length === 0) return 'No splice maps found for this closure.';

  let report = `Splice Report for Closure: ${closureId}\n`;
  report += `Total Maps: ${closureMaps.length}\n\n`;

  closureMaps.forEach(map => {
    const stats = calculateSpliceStatistics(map);
    report += generateVirtualSpliceVisualization(map);
    report += '\n';
  });

  return report;
}

export async function updateSpliceStatus(spliceMapId: string, fiberInOut: { inFiber: number; outFiber: number }, newStatus: string): Promise<void> {
  const maps = await loadSpliceMaps();
  const map = maps.find(m => m.id === spliceMapId);
  if (map) {
    const mapping = map.fiberMappings.find(
      m => m.inFiber === fiberInOut.inFiber && m.outFiber === fiberInOut.outFiber
    );
    if (mapping) {
      mapping.status = newStatus as any;
      await saveSpliceMaps(maps);
    }
  }
}
