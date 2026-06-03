'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { XpLevel, CreateXpLevelDto, UpdateXpLevelDto } from '@/types';

export function useXpLevels() {
  return useQuery({
    queryKey: ['xp-levels'],
    queryFn: async () => {
      const res = await api.get<{ data: XpLevel[] }>('/xp/levels');
      return res.data;
    },
  });
}

export function useXpLevel(id: string) {
  return useQuery({
    queryKey: ['xp-levels', id],
    queryFn: () => api.get<XpLevel>(`/xp/levels/${id}`),
    enabled: !!id,
  });
}

export function useCreateXpLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateXpLevelDto) =>
      api.post<XpLevel>('/xp/levels', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-levels'] });
    },
  });
}

export function useUpdateXpLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateXpLevelDto }) =>
      api.patch<XpLevel>(`/xp/levels/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-levels'] });
    },
  });
}

export function useDeleteXpLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/xp/levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-levels'] });
    },
  });
}
