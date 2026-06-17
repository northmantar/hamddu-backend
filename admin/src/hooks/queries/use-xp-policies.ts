'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  XpEarningPolicy,
  XpActionType,
  CreateXpPolicyDto,
  UpdateXpPolicyDto,
  CreateActionTypeDto,
  UpdateActionTypeDto,
} from '@/types';

// ─── XP 지급 정책 ───────────────────────────────────────────────────────────

export function useXpEarningPolicies() {
  return useQuery({
    queryKey: ['xp-policies'],
    queryFn: async () => {
      const res = await api.get<{ data: XpEarningPolicy[] }>('/xp/policies');
      return res.data;
    },
  });
}

export function useCreateXpEarningPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateXpPolicyDto) =>
      api.post<XpEarningPolicy>('/xp/policies', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-policies'] });
    },
  });
}

export function useUpdateXpEarningPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateXpPolicyDto }) =>
      api.patch<XpEarningPolicy>(`/xp/policies/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-policies'] });
    },
  });
}

export function useDeleteXpEarningPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/xp/policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-policies'] });
    },
  });
}

// ─── XP 액션 타입 ──────────────────────────────────────────────────────────

export function useXpActionTypes() {
  return useQuery({
    queryKey: ['xp-action-types'],
    queryFn: async () => {
      const res = await api.get<{ data: XpActionType[] }>('/xp/action-types');
      return res.data;
    },
  });
}

export function useCreateXpActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateActionTypeDto) =>
      api.post<XpActionType>('/xp/action-types', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-action-types'] });
    },
  });
}

export function useUpdateXpActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, dto }: { code: string; dto: UpdateActionTypeDto }) =>
      api.patch<XpActionType>(`/xp/action-types/${code}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-action-types'] });
    },
  });
}

export function useDeleteXpActionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.delete(`/xp/action-types/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-action-types'] });
    },
  });
}
