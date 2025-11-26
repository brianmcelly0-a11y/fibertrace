export interface PowerMetric {
  nodeId: string;
  power: number;
  timestamp: string;
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  status: 'On Target' | 'Below Target' | 'Above Target';
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsReport {
  period: string;
  jobsCompleted: number;
  jobsInProgress: number;
  averageCompletionTime: number;
  costPerJob: number;
  materialCost: number;
  laborCost: number;
  totalRevenue: number;
  profitMargin: number;
}

export interface TrendData {
  date: string;
  jobs: number;
  power: number;
  cost: number;
  efficiency: number;
}

export interface FaultAnalysis {
  faultType: string;
  count: number;
  averageRepairTime: number;
  costPerFault: number;
  preventionScore: number;
}
