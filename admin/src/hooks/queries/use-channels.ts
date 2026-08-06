'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Channel, ChannelDetail, CreateChannelDto, UpdateChannelDto } from '@/types';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get<{ data: Channel[] }>('/channels');
      return res.data;
    },
  });
}

/** 채널 홈 상세 (소개글·이미지·링크). id가 없으면 조회하지 않는다. */
export function useChannelDetail(id: string | null) {
  return useQuery({
    queryKey: ['channels', id],
    queryFn: () => api.get<ChannelDetail>(`/channels/${id}`),
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateChannelDto) => api.post<Channel>('/channels', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateChannelDto }) =>
      api.patch<Channel>(`/channels/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
