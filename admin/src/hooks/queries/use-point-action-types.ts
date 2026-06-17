'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PointActionType, CreateActionTypeDto, UpdateActionTypeDto } from '@/types';

export function usePointActionTypes() {
  return useQuery({
    queryKey: ['point-action-types'],
    queryFn: async () => {
      const res = await api.get<{ data: PointActionType[] }>('/points/action-types');
      return res.data;
    },
  });
}

export function useCreatePointActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateActionTypeDto) =>
      api.post<PointActionType>('/points/action-types', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-action-types'] });
    },
  });
}

export function useUpdatePointActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, dto }: { code: string; dto: UpdateActionTypeDto }) =>
      api.patch<PointActionType>(`/points/action-types/${code}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-action-types'] });
    },
  });
}

export function useDeletePointActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.delete(`/points/action-types/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-action-types'] });
    },
  });
}
