'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useContents, useUpdateContent } from '@/hooks/queries/use-contents';
import { useToast } from '@/components/ui/toast';
import type { Content, ContentStatus } from '@/types';

const STATUS_LABELS: Record<ContentStatus, string> = { active: '활성', inactive: '비활성' };
const TYPE_LABELS: Record<string, string> = { free: '무료 도안', normal: '일반' };

interface EditState {
  name: string;
  sourceVideoId: string;
}

export default function GeneralContentsPage() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', sourceVideoId: '' });

  const { addToast } = useToast();
  const updateContent = useUpdateContent();

  // free + normal 콘텐츠를 별도 조회 후 병합
  const { data: freeData, isLoading: freeLoading } = useContents({ type: 'free', limit: 100 });
  const { data: normalData, isLoading: normalLoading } = useContents({ type: 'normal', limit: 100 });

  const allContents = [...(freeData?.data ?? []), ...(normalData?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const PAGE_SIZE = 20;
  const totalCount = allContents.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pagedContents = allContents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isLoading = freeLoading || normalLoading;

  const handleStatusChange = async (content: Content, status: ContentStatus) => {
    try {
      await updateContent.mutateAsync({ id: content.id, dto: { status } });
      addToast('상태가 변경되었습니다.', 'success');
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const startEdit = (content: Content) => {
    setEditingId(content.id);
    setEditState({ name: content.name, sourceVideoId: content.sourceVideoId });
  };

  const handleSave = async (content: Content) => {
    try {
      await updateContent.mutateAsync({
        id: content.id,
        dto: { name: editState.name, sourceVideoId: editState.sourceVideoId },
      });
      addToast('수정되었습니다.', 'success');
      setEditingId(null);
    } catch {
      addToast('수정에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">일반 콘텐츠 관리</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : !pagedContents.length ? (
          <div className="p-8 text-center text-gray-500">등록된 콘텐츠가 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">Video ID</th>
                <th className="px-4 py-3 text-left">채널명</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">업로드 일자</th>
                <th className="px-4 py-3 text-left">수정</th>
              </tr>
            </thead>
            <tbody>
              {pagedContents.map((content) => {
                const isEditing = editingId === content.id;
                return (
                  <tr key={content.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editState.name}
                          onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">{content.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editState.sourceVideoId}
                          onChange={(e) => setEditState((s) => ({ ...s, sourceVideoId: e.target.value }))}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-sm text-gray-500 font-mono">{content.sourceVideoId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{content.channel?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {TYPE_LABELS[content.type] ?? content.type}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={content.status}
                        onChange={(e) => handleStatusChange(content, e.target.value as ContentStatus)}
                        options={[
                          { value: 'active', label: STATUS_LABELS.active },
                          { value: 'inactive', label: STATUS_LABELS.inactive },
                        ]}
                        className="w-24"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {content.uploadedAt ? new Date(content.uploadedAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSave(content)} isLoading={updateContent.isPending}>저장</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>취소</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => startEdit(content)}>수정</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
