'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Content, CreateContentDto, UpdateContentDto, PaginatedResponse } from '@/types';

interface UseContentsParams {
  page?: number;
  limit?: number;
  channelId?: string;
}

export function useContents(params: UseContentsParams = {}) {
  const { page = 1, limit = 10, channelId } = params;

  return useQuery({
    queryKey: ['contents', { page, limit, channelId }],
    queryFn: () =>
      api.get<PaginatedResponse<Content>>('/contents', {
        params: { page, limit, channelId },
      }),
  });
}

export function useContent(id: string) {
  return useQuery({
    queryKey: ['contents', id],
    queryFn: () => api.get<Content>(`/contents/${id}`),
    enabled: !!id,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateContentDto) =>
      api.post<Content>('/contents', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateContentDto }) =>
      api.patch<Content>(`/contents/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/contents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}
