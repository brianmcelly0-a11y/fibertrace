import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from "./offlineStorage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (!navigator.onLine && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
    offlineStorage.addToSyncQueue(url, method as any, data);
    return new Response(JSON.stringify({ queued: true }), { status: 202 });
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type CacheKey = 'jobs' | 'inventory' | 'clients' | 'olts' | 'splitters' | 'fats' | 'atbs' | 'closures' | 'spliceRecords' | 'powerReadings' | 'fiberRoutes' | 'fieldReports';

const CACHE_KEY_MAP: Record<string, CacheKey> = {
  '/api/jobs': 'jobs',
  '/api/inventory': 'inventory',
  '/api/clients': 'clients',
  '/api/olts': 'olts',
  '/api/splitters': 'splitters',
  '/api/fats': 'fats',
  '/api/atbs': 'atbs',
  '/api/closures': 'closures',
  '/api/splice-records': 'spliceRecords',
  '/api/power-readings': 'powerReadings',
  '/api/fiber-routes': 'fiberRoutes',
  '/api/field-reports': 'fieldReports',
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = Array.isArray(queryKey) && queryKey.length > 0 
      ? (queryKey[0] as string)
      : (queryKey as string);
    
    if (!navigator.onLine) {
      const cacheKey = CACHE_KEY_MAP[endpoint];
      if (cacheKey) {
        const cachedData = offlineStorage.getCachedData(cacheKey);
        console.log(`Using cached data for ${endpoint}`);
        return cachedData as any;
      }
    }

    const res = await fetch(endpoint, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    const cacheKey = CACHE_KEY_MAP[endpoint];
    if (cacheKey && Array.isArray(data)) {
      offlineStorage.cacheData(cacheKey, data);
    }
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
