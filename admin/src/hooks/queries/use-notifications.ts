'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  NotificationCampaign,
  NotificationTemplate,
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateTemplateDto,
} from '@/types';

// ─── 공지/배치 캠페인 ────────────────────────────────────────────────────────

export function useCampaigns() {
  return useQuery({
    queryKey: ['notification-campaigns'],
    queryFn: () => api.get<NotificationCampaign[]>('/notifications/campaigns'),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignDto) =>
      api.post<NotificationCampaign>('/notifications/campaigns', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-campaigns'] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignDto }) =>
      api.patch<NotificationCampaign>(`/notifications/campaigns/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-campaigns'] }),
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/campaigns/${id}/pause`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-campaigns'] }),
  });
}

export function useResumeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/campaigns/${id}/resume`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-campaigns'] }),
  });
}

// ─── 레벨업 템플릿 ───────────────────────────────────────────────────────────

export function useLevelUpTemplate() {
  return useQuery({
    queryKey: ['notification-template', 'level-up'],
    queryFn: () => api.get<NotificationTemplate>('/notifications/templates/level-up'),
  });
}

export function useUpdateLevelUpTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateTemplateDto) =>
      api.patch<NotificationTemplate>('/notifications/templates/level-up', dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['notification-template', 'level-up'] }),
  });
}
