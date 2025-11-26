export interface SearchFilter {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'range';
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
  value: any;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilter[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  type: 'job' | 'node' | 'route' | 'inventory';
  id: string;
  title: string;
  description: string;
  relevance: number;
  metadata: Record<string, any>;
}

export interface SearchQuery {
  text: string;
  filters: SearchFilter[];
  scope: 'all' | 'jobs' | 'nodes' | 'routes' | 'inventory';
  sortBy: 'relevance' | 'date' | 'name';
  limit: number;
}
