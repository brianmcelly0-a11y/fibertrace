export type ReportFormat = 'PDF' | 'CSV' | 'JSON' | 'Excel';
export type ReportType = 'JobCompletion' | 'TeamPerformance' | 'Inventory' | 'PowerAnalysis' | 'CostBreakdown' | 'RouteAnalysis';

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  sections: string[];
  filters: Record<string, any>;
  createdAt: string;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  period: string;
  summary: Record<string, any>;
  details: Record<string, any>[];
  charts: Chart[];
}

export interface Chart {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'histogram';
  data: any[];
  options: Record<string, any>;
}

export interface ExportOptions {
  includeCharts: boolean;
  includeMetadata: boolean;
  compression: boolean;
  pageBreaks: boolean;
}
