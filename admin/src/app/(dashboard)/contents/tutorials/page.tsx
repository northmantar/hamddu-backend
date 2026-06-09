'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useTutorials, useCreateContent, useUpdateContent, useDeleteContent, useReorderTutorials } from '@/hooks/queries/use-contents';
import { useChannels } from '@/hooks/queries/use-channels';
import { useToast } from '@/components/ui/toast';
import type { Content, ContentStatus, UserInterests, CreateContentDto } from '@/types';

type Tab = UserInterests;

const STATUS_LABELS: Record<ContentStatus, string> = { active: '활성', inactive: '비활성' };
const TAB_LABELS: Record<Tab, string> = { crochet: '코바늘', knitting: '대바늘' };

interface SortableRowProps {
  content: Content;
  channels: Array<{ id: string; name: string }>;
  onStatusChange: (content: Content, status: ContentStatus) => void;
  onUpdate: (content: Content, name: string, sourceVideoId: string, channelId: string) => void;
  onDelete: (content: Content) => void;
}

function SortableRow({ content, channels, onStatusChange, onUpdate, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: content.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(content.name);
  const [editVideoId, setEditVideoId] = useState(content.sourceVideoId);
  const [editChannelId, setEditChannelId] = useState(content.channelId ?? '');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(content, editName, editVideoId, editChannelId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(content.name);
    setEditVideoId(content.sourceVideoId);
    setEditChannelId(content.channelId ?? '');
    setIsEditing(false);
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-500 w-12 text-center">{content.sortOrder ?? '-'}</td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full" />
        ) : (
          <span className="text-sm font-medium">{content.name}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input value={editVideoId} onChange={(e) => setEditVideoId(e.target.value)} className="w-full" />
        ) : (
          <span className="text-sm text-gray-500 font-mono">{content.sourceVideoId}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <select
            value={editChannelId}
            onChange={(e) => setEditChannelId(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            <option value="">채널 없음</option>
            {channels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
        ) : (
          <span className="text-sm">{content.channel?.name ?? '-'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Select
          value={content.status}
          onChange={(e) => onStatusChange(content, e.target.value as ContentStatus)}
          options={[
            { value: 'active', label: STATUS_LABELS.active },
            { value: 'inactive', label: STATUS_LABELS.inactive },
          ]}
          className="w-24"
        />
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave}>저장</Button>
            <Button size="sm" variant="secondary" onClick={handleCancel}>취소</Button>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>수정</Button>
        )}
      </td>
      <td className="px-4 py-3">
        <Button size="sm" variant="danger" onClick={() => onDelete(content)}>삭제</Button>
      </td>
      <td className="px-4 py-3 w-10 text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          title="드래그하여 순서 변경"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default function TutorialsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('crochet');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateContentDto>>({});

  const { data: tutorials, isLoading } = useTutorials(activeTab);
  const { data: channels } = useChannels();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();
  const reorderTutorials = useReorderTutorials();
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !tutorials) return;

      const oldIndex = tutorials.findIndex((t) => t.id === active.id);
      const newIndex = tutorials.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(tutorials, oldIndex, newIndex);

      try {
        await reorderTutorials.mutateAsync({
          interests: activeTab,
          contentIds: reordered.map((t) => t.id),
        });
        addToast('순서가 변경되었습니다.', 'success');
      } catch {
        addToast('순서 변경에 실패했습니다.', 'error');
      }
    },
    [tutorials, activeTab, reorderTutorials, addToast],
  );

  const handleStatusChange = async (content: Content, status: ContentStatus) => {
    try {
      await updateContent.mutateAsync({ id: content.id, dto: { status } });
      addToast('상태가 변경되었습니다.', 'success');
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (content: Content, name: string, sourceVideoId: string, channelId: string) => {
    try {
      await updateContent.mutateAsync({
        id: content.id,
        dto: { name, sourceVideoId, channelId: channelId || undefined },
      });
      addToast('수정되었습니다.', 'success');
    } catch {
      addToast('수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (content: Content) => {
    if (!confirm(`"${content.name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await deleteContent.mutateAsync(content.id);
      addToast('삭제되었습니다.', 'success');
    } catch {
      addToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.sourceVideoId || !createForm.interests) return;
    try {
      await createContent.mutateAsync({
        channelId: createForm.channelId ?? '',
        sourceVideoId: createForm.sourceVideoId,
        name: createForm.name,
        type: 'symbol',
        interests: createForm.interests,
        pointApplyable: true,
        status: 'active',
        mediaId: createForm.mediaId,
      });
      addToast('콘텐츠가 생성되었습니다.', 'success');
      setIsCreateModalOpen(false);
      setCreateForm({});
    } catch {
      addToast('생성에 실패했습니다.', 'error');
    }
  };

  const channelOptions = [
    { value: '', label: '채널 없음' },
    ...(channels?.map((ch) => ({ value: ch.id, label: ch.name })) ?? []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">튜토리얼 콘텐츠 관리</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>튜토리얼 추가</Button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['crochet', 'knitting'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : !tutorials?.length ? (
          <div className="p-8 text-center text-gray-500">등록된 튜토리얼이 없습니다.</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tutorials.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No.</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">Video ID</th>
                    <th className="px-4 py-3 text-left">채널명</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">수정</th>
                    <th className="px-4 py-3 text-left">삭제</th>
                    <th className="px-4 py-3 text-center w-10">순서</th>
                  </tr>
                </thead>
                <tbody>
                  {tutorials.map((content) => (
                    <SortableRow
                      key={content.id}
                      content={content}
                      channels={channels ?? []}
                      onStatusChange={handleStatusChange}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 튜토리얼 생성 모달 */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="튜토리얼 추가">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">관심사</label>
            <select
              value={createForm.interests ?? ''}
              onChange={(e) => setCreateForm((f) => ({ ...f, interests: e.target.value as UserInterests }))}
              className="border rounded-lg px-3 py-2 w-full text-sm"
              required
            >
              <option value="">선택</option>
              <option value="crochet">코바늘</option>
              <option value="knitting">대바늘</option>
            </select>
          </div>
          <Input
            label="영상 제목"
            value={createForm.name ?? ''}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="영상 제목 입력"
            required
          />
          <Input
            label="Video ID"
            value={createForm.sourceVideoId ?? ''}
            onChange={(e) => setCreateForm((f) => ({ ...f, sourceVideoId: e.target.value }))}
            placeholder="플랫폼 비디오 ID"
            required
          />
          <Select
            label="채널"
            value={createForm.channelId ?? ''}
            onChange={(e) => setCreateForm((f) => ({ ...f, channelId: e.target.value }))}
            options={channelOptions}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setCreateForm({}); }}>취소</Button>
            <Button type="submit" isLoading={createContent.isPending}>추가</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
