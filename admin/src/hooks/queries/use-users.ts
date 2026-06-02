'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, PaginatedResponse } from '@/types';

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useUsers(params: UseUsersParams = {}) {
  const { page = 1, limit = 10, search } = params;

  return useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: () =>
      api.get<PaginatedResponse<User>>('/users', {
        params: { page, limit, search },
      }),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      api.patch<User>(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
