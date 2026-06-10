'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BoardReport, CommentReport, PaginatedResponse, ReportStatus, UpdateReportDto } from '@/types';

interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
}

// ── 게시글 신고 ────────────────────────────────────────────────────────────

export function useBoardReports(params: ReportQueryParams = {}) {
  const { page = 1, limit = 20, status } = params;
  return useQuery({
    queryKey: ['reports', 'boards', { page, limit, status }],
    queryFn: () =>
      api.get<PaginatedResponse<BoardReport>>('/boards/admin/reports', {
        params: { page, limit, ...(status ? { status } : {}) },
      }),
  });
}

export function useUpdateBoardReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, dto }: { reportId: string; dto: UpdateReportDto }) =>
      api.patch<BoardReport>(`/boards/admin/reports/${reportId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'boards'] });
    },
  });
}

// ── 댓글 신고 ──────────────────────────────────────────────────────────────

export function useCommentReports(params: ReportQueryParams = {}) {
  const { page = 1, limit = 20, status } = params;
  return useQuery({
    queryKey: ['reports', 'comments', { page, limit, status }],
    queryFn: () =>
      api.get<PaginatedResponse<CommentReport>>('/boards/admin/comment-reports', {
        params: { page, limit, ...(status ? { status } : {}) },
      }),
  });
}

export function useUpdateCommentReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, dto }: { reportId: string; dto: UpdateReportDto }) =>
      api.patch<CommentReport>(`/boards/admin/comment-reports/${reportId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'comments'] });
    },
  });
}
