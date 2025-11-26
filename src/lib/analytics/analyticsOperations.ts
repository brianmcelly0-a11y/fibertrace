import { PowerMetric, PerformanceMetric, CostBreakdown, AnalyticsReport, TrendData, FaultAnalysis } from './types';

export function calculatePowerMetrics(readings: PowerMetric[]): { average: number; min: number; max: number; critical: number } {
  if (readings.length === 0) return { average: 0, min: 0, max: 0, critical: 0 };

  const values = readings.map(r => r.power);
  return {
    average: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    critical: readings.filter(r => r.status === 'Critical').length,
  };
}

export function getPerformanceMetrics(jobs: any[]): PerformanceMetric[] {
  const completed = jobs.filter(j => j.status === 'Completed');
  const avgTime = completed.length > 0 ? completed.reduce((acc, j) => acc + (j.duration || 0), 0) / completed.length : 0;
  const targetTime = 7200; // 2 hours

  return [
    {
      metric: 'On-Time Completion',
      value: ((completed.filter(j => j.duration <= targetTime).length / Math.max(completed.length, 1)) * 100),
      target: 90,
      status: 'On Target',
    },
    {
      metric: 'First-Time Fix Rate',
      value: 92,
      target: 95,
      status: 'Below Target',
    },
    {
      metric: 'Technician Utilization',
      value: 78,
      target: 80,
      status: 'On Target',
    },
    {
      metric: 'Customer Satisfaction',
      value: 88,
      target: 85,
      status: 'Above Target',
    },
  ];
}

export function getCostBreakdown(jobs: any[]): CostBreakdown[] {
  const completed = jobs.filter(j => j.status === 'Completed');
  const totalCost = completed.reduce((acc, j) => acc + (j.actualCost || j.estimatedCost), 0);
  const materialCost = totalCost * 0.4;
  const laborCost = totalCost * 0.5;
  const overheadCost = totalCost * 0.1;

  return [
    { category: 'Materials', amount: materialCost, percentage: 40 },
    { category: 'Labor', amount: laborCost, percentage: 50 },
    { category: 'Overhead', amount: overheadCost, percentage: 10 },
  ];
}

export function generateAnalyticsReport(jobs: any[], period: string): AnalyticsReport {
  const completed = jobs.filter(j => j.status === 'Completed');
  const inProgress = jobs.filter(j => j.status === 'In Progress');
  const totalCost = completed.reduce((acc, j) => acc + (j.actualCost || j.estimatedCost), 0);
  const avgTime = completed.length > 0 ? completed.reduce((acc, j) => acc + (j.duration || 0), 0) / completed.length : 0;

  return {
    period,
    jobsCompleted: completed.length,
    jobsInProgress: inProgress.length,
    averageCompletionTime: avgTime,
    costPerJob: completed.length > 0 ? totalCost / completed.length : 0,
    materialCost: totalCost * 0.4,
    laborCost: totalCost * 0.5,
    totalRevenue: totalCost * 1.3, // 30% margin
    profitMargin: 30,
  };
}

export function getTrendData(days: number = 30): TrendData[] {
  const data: TrendData[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    data.push({
      date,
      jobs: Math.floor(Math.random() * 10) + 5,
      power: Math.random() * 10 - 5,
      cost: Math.floor(Math.random() * 2000) + 1000,
      efficiency: Math.random() * 20 + 75,
    });
  }
  return data;
}

export function analyzeByFaultType(faults: any[]): FaultAnalysis[] {
  const faultTypes = new Map<string, any[]>();

  faults.forEach(fault => {
    const type = fault.type || 'Unknown';
    if (!faultTypes.has(type)) {
      faultTypes.set(type, []);
    }
    faultTypes.get(type)!.push(fault);
  });

  return Array.from(faultTypes.entries()).map(([type, items]) => ({
    faultType: type,
    count: items.length,
    averageRepairTime: items.length > 0 ? items.reduce((acc, f) => acc + (f.repairTime || 120), 0) / items.length : 0,
    costPerFault: items.length > 0 ? items.reduce((acc, f) => acc + (f.cost || 500), 0) / items.length : 0,
    preventionScore: Math.random() * 40 + 60,
  }));
}
