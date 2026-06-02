'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PointPolicy, CreatePointPolicyDto, UpdatePointPolicyDto } from '@/types';

export function usePointPolicies() {
  return useQuery({
    queryKey: ['point-policies'],
    queryFn: () => api.get<PointPolicy[]>('/points/policies'),
  });
}

export function usePointPolicy(id: string) {
  return useQuery({
    queryKey: ['point-policies', id],
    queryFn: () => api.get<PointPolicy>(`/points/policies/${id}`),
    enabled: !!id,
  });
}

export function useCreatePointPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePointPolicyDto) =>
      api.post<PointPolicy>('/points/policies', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-policies'] });
    },
  });
}

export function useUpdatePointPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePointPolicyDto }) =>
      api.patch<PointPolicy>(`/points/policies/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-policies'] });
    },
  });
}

export function useDeletePointPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/points/policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-policies'] });
    },
  });
}
