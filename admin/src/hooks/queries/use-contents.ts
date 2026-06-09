'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Content, CreateContentDto, UpdateContentDto, PaginatedResponse, ContentType, UserInterests } from '@/types';

interface UseContentsParams {
  page?: number;
  limit?: number;
  type?: ContentType;
  channelId?: string;
}

export function useContents(params: UseContentsParams = {}) {
  const { page = 1, limit = 20, type, channelId } = params;

  return useQuery({
    queryKey: ['contents', { page, limit, type, channelId }],
    queryFn: () =>
      api.get<PaginatedResponse<Content>>('/contents', {
        params: { page, limit, ...(type ? { type } : {}), ...(channelId ? { channelId } : {}) },
      }),
  });
}

export function useTutorials(interests: UserInterests) {
  return useQuery({
    queryKey: ['contents', 'tutorials', interests],
    queryFn: () =>
      api.get<Content[]>(`/contents/tutorials`, { params: { interests } }),
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateContentDto) => api.post<Content>('/contents', dto),
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

export function useReorderTutorials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ interests, contentIds }: { interests: UserInterests; contentIds: string[] }) =>
      api.patch<void>(`/contents/tutorials/${interests}/order`, { contentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents', 'tutorials'] });
    },
  });
}
