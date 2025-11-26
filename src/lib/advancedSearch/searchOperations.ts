import { SearchFilter, SavedSearch, SearchResult, SearchQuery } from './types';

export function createFilter(
  name: string,
  field: string,
  operator: string,
  value: any
): SearchFilter {
  return {
    id: `filter-${Date.now()}`,
    name,
    type: 'text',
    field,
    operator: operator as any,
    value,
  };
}

export function saveSearch(name: string, filters: SearchFilter[]): SavedSearch {
  return {
    id: `search-${Date.now()}`,
    name,
    filters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function executeSearch(jobs: any[], query: SearchQuery): SearchResult[] {
  const results: SearchResult[] = [];

  jobs.forEach(job => {
    let relevance = 0;
    let matches = true;

    // Text search
    if (query.text) {
      const text = query.text.toLowerCase();
      if (job.name?.toLowerCase().includes(text)) relevance += 100;
      if (job.description?.toLowerCase().includes(text)) relevance += 50;
      if (job.jobId?.toLowerCase().includes(text)) relevance += 75;
    }

    // Filter matching
    query.filters.forEach(filter => {
      const fieldValue = job[filter.field];
      switch (filter.operator) {
        case 'equals':
          if (fieldValue !== filter.value) matches = false;
          break;
        case 'contains':
          if (!String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())) matches = false;
          break;
        case 'gt':
          if (!(fieldValue > filter.value)) matches = false;
          break;
        case 'lt':
          if (!(fieldValue < filter.value)) matches = false;
          break;
        case 'between':
          if (!(fieldValue >= filter.value[0] && fieldValue <= filter.value[1])) matches = false;
          break;
      }
    });

    if (matches && relevance > 0) {
      results.push({
        type: 'job',
        id: job.id,
        title: job.name,
        description: job.description || '',
        relevance,
        metadata: { status: job.status, priority: job.priority, assignedTechnician: job.assignedTechnician },
      });
    }
  });

  return results.sort((a, b) => {
    if (query.sortBy === 'relevance') return b.relevance - a.relevance;
    return 0;
  }).slice(0, query.limit);
}

export function getRecentSearches(searches: SavedSearch[]): SavedSearch[] {
  return searches.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);
}
