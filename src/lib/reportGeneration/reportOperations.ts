import { ReportTemplate, ReportData, ReportType, ReportFormat, Chart } from './types';

export function createReportTemplate(
  name: string,
  type: ReportType,
  format: ReportFormat,
  sections: string[]
): ReportTemplate {
  return {
    id: `report-${Date.now()}`,
    name,
    type,
    format,
    sections,
    filters: {},
    createdAt: new Date().toISOString(),
  };
}

export function generateJobCompletionReport(jobs: any[], period: string): ReportData {
  const completed = jobs.filter(j => j.status === 'Completed');
  const totalCost = completed.reduce((acc, j) => acc + (j.actualCost || 0), 0);
  const avgDuration = completed.length > 0 ? completed.reduce((acc, j) => acc + (j.duration || 0), 0) / completed.length : 0;

  return {
    title: 'Job Completion Report',
    generatedAt: new Date().toISOString(),
    period,
    summary: {
      jobsCompleted: completed.length,
      totalCost,
      averageDuration: avgDuration,
      completionRate: (completed.length / Math.max(jobs.length, 1)) * 100,
    },
    details: completed.map(job => ({
      jobId: job.jobId,
      name: job.name,
      cost: job.actualCost,
      duration: job.duration,
      technician: job.assignedTechnician,
    })),
    charts: [
      {
        id: 'chart-1',
        title: 'Jobs by Status',
        type: 'pie',
        data: [
          { label: 'Completed', value: completed.length },
          { label: 'Pending', value: jobs.filter(j => j.status === 'Pending').length },
        ],
        options: {},
      },
    ],
  };
}

export function generateTeamPerformanceReport(technicians: any[], assignments: any[]): ReportData {
  return {
    title: 'Team Performance Report',
    generatedAt: new Date().toISOString(),
    period: 'Current Week',
    summary: {
      totalTechnicians: technicians.length,
      totalAssignments: assignments.length,
      averageUtilization: 75,
      completionRate: 88,
    },
    details: technicians.map(tech => ({
      name: tech.name,
      role: tech.role,
      utilization: tech.currentUtilization,
      assignedJobs: assignments.filter(a => a.technicianId === tech.id).length,
    })),
    charts: [
      {
        id: 'chart-2',
        title: 'Team Utilization',
        type: 'bar',
        data: technicians.map(t => ({ name: t.name, value: t.currentUtilization })),
        options: {},
      },
    ],
  };
}

export function generateInventoryReport(items: any[]): ReportData {
  const lowStock = items.filter(i => i.currentStock <= i.minimumStock);
  const totalValue = items.reduce((acc, i) => acc + (i.currentStock * i.costPerUnit), 0);

  return {
    title: 'Inventory Report',
    generatedAt: new Date().toISOString(),
    period: 'Current Month',
    summary: {
      totalItems: items.length,
      lowStockItems: lowStock.length,
      totalValue,
      turnoverRate: 1.2,
    },
    details: items.map(item => ({
      itemId: item.itemId,
      name: item.name,
      stock: item.currentStock,
      minRequired: item.minimumStock,
      value: item.currentStock * item.costPerUnit,
    })),
    charts: [
      {
        id: 'chart-3',
        title: 'Stock Levels',
        type: 'histogram',
        data: items.map(i => ({ name: i.name, current: i.currentStock, minimum: i.minimumStock })),
        options: {},
      },
    ],
  };
}

export function exportReport(data: ReportData, format: ReportFormat): string {
  switch (format) {
    case 'JSON':
      return JSON.stringify(data, null, 2);
    case 'CSV':
      return convertToCSV(data);
    case 'PDF':
      return `PDF Report: ${data.title}\n${JSON.stringify(data)}`;
    case 'Excel':
      return `Excel Report: ${data.title}\n${JSON.stringify(data)}`;
    default:
      return '';
  }
}

function convertToCSV(data: ReportData): string {
  const rows = [
    [`Report: ${data.title}`],
    [`Generated: ${data.generatedAt}`],
    [''],
    ['Summary:'],
    ...Object.entries(data.summary).map(([key, value]) => [key, value]),
    [''],
    ['Details:'],
    ...data.details.map(detail => Object.values(detail)),
  ];
  return rows.map(row => row.join(',')).join('\n');
}
