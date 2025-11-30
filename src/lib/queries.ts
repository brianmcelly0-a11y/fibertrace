import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// Query Keys
export const queryKeys = {
  auth: ['auth'],
  me: ['auth', 'me'],
  map: ['map'],
  mapData: ['map', 'data'],
  mapLayers: (layers?: string[]) => ['map', 'layers', ...(layers || [])],
  routes: ['routes'],
  route: (id: number) => ['routes', id],
  nodes: ['nodes'],
  node: (id: number) => ['nodes', id],
  closures: ['closures'],
  closure: (id: number) => ['closures', id],
  splitters: ['splitters'],
  splices: ['splices'],
  customers: ['customers'],
  uploads: ['uploads'],
  stats: ['stats'],
};

// ============ AUTH QUERIES ============
export function useGetMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getMe(),
    retry: 1,
  });
}

// ============ MAP QUERIES ============
export function useMapData() {
  return useQuery({
    queryKey: queryKeys.mapData,
    queryFn: () => api.getMapData(),
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

export function useMapLayers(layers?: string[]) {
  return useQuery({
    queryKey: queryKeys.mapLayers(layers),
    queryFn: () => api.getMapLayers(layers),
    staleTime: 30000,
    retry: 2,
  });
}

// ============ ROUTES QUERIES ============
export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: () => api.getRoutes(),
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: queryKeys.route(id),
    queryFn: () => api.getRoute(id),
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes });
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData });
    },
  });
}

// ============ NODES QUERIES ============
export function useNodes() {
  return useQuery({
    queryKey: queryKeys.nodes,
    queryFn: () => api.getNodes(),
    staleTime: 60000,
    retry: 1,
  });
}

export function useNode(id: number) {
  return useQuery({
    queryKey: queryKeys.node(id),
    queryFn: () => api.getNode(id),
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createNode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes });
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateNode(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.node(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes });
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData });
    },
  });
}

// ============ CLOSURES QUERIES ============
export function useClosures() {
  return useQuery({
    queryKey: queryKeys.closures,
    queryFn: () => api.getClosures(),
    staleTime: 60000,
    retry: 1,
  });
}

export function useClosure(id: number) {
  return useQuery({
    queryKey: queryKeys.closure(id),
    queryFn: () => api.getClosure(id),
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateClosure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createClosure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closures });
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData });
    },
  });
}

// ============ UPLOADS QUERIES ============
export function useUploads() {
  return useQuery({
    queryKey: queryKeys.uploads,
    queryFn: () => api.getUploads(),
    staleTime: 30000,
    retry: 1,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, entityType, entityId }: { file: File; entityType?: string; entityId?: number }) =>
      api.uploadFile(file, entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads });
    },
  });
}

// ============ STATS QUERY ============
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => api.getStats(),
    staleTime: 60000,
    retry: 1,
  });
}
