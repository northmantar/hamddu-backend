'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { useCommentReports, useUpdateCommentReport } from '@/hooks/queries/use-reports';
import { useToast } from '@/components/ui/toast';
import type { CommentReport, ReportStatus } from '@/types';

const REASON_LABELS: Record<string, string> = {
  spam: '스팸/광고',
  harassment: '욕설/비방',
  inappropriate: '부적절한 콘텐츠',
  copyright: '저작권 침해',
  other: '기타',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '미처리',
  resolved: '미노출 처리됨',
  rejected: '기각됨',
};

const STATUS_BADGE_VARIANT: Record<ReportStatus, 'warning' | 'danger' | 'success'> = {
  pending: 'warning',
  resolved: 'danger',
  rejected: 'success',
};

export default function CommentReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');

  const { data, isLoading } = useCommentReports({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });
  const updateReport = useUpdateCommentReport();
  const { addToast } = useToast();

  const handleProcess = async (report: CommentReport, status: 'resolved' | 'rejected') => {
    const label = status === 'resolved' ? '미노출 처리' : '기각';
    if (!confirm(`이 신고를 "${label}"하시겠습니까?${status === 'resolved' ? '\n해당 댓글이 숨김 처리됩니다.' : ''}`)) return;
    try {
      await updateReport.mutateAsync({ reportId: report.id, dto: { status } });
      addToast(`${label}되었습니다.`, 'success');
    } catch {
      addToast('처리에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">댓글 신고 관리</h1>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ReportStatus | ''); setPage(1); }}
          options={[
            { value: '', label: '전체' },
            { value: 'pending', label: '미처리' },
            { value: 'resolved', label: '미노출 처리됨' },
            { value: 'rejected', label: '기각됨' },
          ]}
          className="w-auto"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-500">신고 내역이 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">댓글 내용</th>
                <th className="px-4 py-3 text-left">신고 사유</th>
                <th className="px-4 py-3 text-left">상세 내용</th>
                <th className="px-4 py-3 text-left">신고자</th>
                <th className="px-4 py-3 text-left">신고일시</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">처리</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((report) => (
                <tr key={report.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium max-w-xs truncate">{report.comment.body}</div>
                    <div className="text-xs text-gray-400">게시글 {report.comment.boardId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{REASON_LABELS[report.reason] ?? report.reason}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                    {report.description ?? <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{report.reporter.nickname}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
                      {STATUS_LABELS[report.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {report.status === 'pending' ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleProcess(report, 'resolved')}
                          isLoading={updateReport.isPending}
                        >
                          미노출
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleProcess(report, 'rejected')}
                          isLoading={updateReport.isPending}
                        >
                          기각
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {report.processedAt ? new Date(report.processedAt).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <Pagination
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
