'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, PaginatedResponse, CreateUserAdminDto, UserType, UserStatus } from '@/types';

interface UseUsersParams {
  page?: number;
  limit?: number;
  type?: UserType;
}

export function useUsers(params: UseUsersParams = {}) {
  const { page = 1, limit = 10, type } = params;

  return useQuery({
    queryKey: ['users', { page, limit, type }],
    queryFn: () =>
      api.get<PaginatedResponse<User>>('/users', {
        params: { page, limit, ...(type ? { type } : {}) },
      }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUserAdminDto) => api.post<User>('/users', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: UserType }) =>
      api.patch<User>(`/users/${id}/role`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.patch<void>(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post<void>(`/auth/admin/users/${id}/reset-password`, { newPassword }),
  });
}
