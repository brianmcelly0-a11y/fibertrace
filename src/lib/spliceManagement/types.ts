// Splice Management Types
export interface Fiber {
  fiberNumber: number;
  colorCode: string;
  status: 'Good' | 'Spliced' | 'Terminated' | 'Reserved';
}

export interface SpliceMap {
  id: string;
  closureId: string;
  cableInId: string;
  cableOutId: string;
  fiberMappings: Array<{
    inFiber: number;
    outFiber: number;
    lossReading: number;
    status: 'Good' | 'High-Loss' | 'Broken';
  }>;
  timestamp: string;
  technicianId: string;
  notes: string;
}

export interface SpliceStatistics {
  totalSplices: number;
  avgLoss: number;
  highLossCount: number;
  faultCount: number;
  goodCount: number;
}
