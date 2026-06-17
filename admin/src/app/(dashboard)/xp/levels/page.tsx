'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useXpLevels, useCreateXpLevel, useUpdateXpLevel, useDeleteXpLevel } from '@/hooks/queries/use-xp';
import { useToast } from '@/components/ui/toast';
import { XpLevelForm, type XpLevelFormData } from '@/components/forms/xp-level-form';
import type { XpLevel, CreateXpLevelDto, UpdateXpLevelDto } from '@/types';

export default function XpLevelsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<XpLevel | null>(null);
  const { data: levels, isLoading } = useXpLevels();
  const createLevel = useCreateXpLevel();
  const updateLevel = useUpdateXpLevel();
  const deleteLevel = useDeleteXpLevel();
  const { addToast } = useToast();

  const handleCreate = async (dto: XpLevelFormData) => {
    try {
      await createLevel.mutateAsync(dto as CreateXpLevelDto);
      addToast('레벨이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('레벨 추가에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (dto: XpLevelFormData) => {
    if (!editingLevel) return;
    try {
      const { level: _omit, ...rest } = dto;
      await updateLevel.mutateAsync({ id: editingLevel.id, dto: rest as UpdateXpLevelDto });
      addToast('레벨이 수정되었습니다.', 'success');
      setEditingLevel(null);
    } catch {
      addToast('레벨 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 레벨을 비활성화하시겠습니까?')) return;
    try {
      await deleteLevel.mutateAsync(id);
      addToast('레벨이 비활성화되었습니다.', 'success');
    } catch {
      addToast('레벨 삭제에 실패했습니다.', 'error');
    }
  };

  const sortedLevels = [...(levels || [])].sort((a, b) => a.level - b.level);

  const columns = [
    {
      key: 'level',
      header: '레벨',
      render: (level: XpLevel) => <span className="font-bold text-lg">{level.level}</span>,
    },
    {
      key: 'label',
      header: '이름',
      render: (level: XpLevel) => (
        <span className="font-medium">{level.label ?? level.name ?? '-'}</span>
      ),
    },
    {
      key: 'xpThreshold',
      header: 'XP 임계값',
      render: (level: XpLevel) => (
        <span className="font-mono">{(level.xpThreshold ?? level.minXp ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (level: XpLevel) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditingLevel(level)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(level.id)}>
            비활성화
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">누적 XP 레벨</h1>
        <Button onClick={() => setIsModalOpen(true)}>레벨 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={sortedLevels}
          keyExtractor={(level) => level.id}
          isLoading={isLoading}
          emptyMessage="등록된 레벨이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="레벨 추가">
        <XpLevelForm
          onSubmit={handleCreate}
          isLoading={createLevel.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingLevel} onClose={() => setEditingLevel(null)} title="레벨 수정">
        {editingLevel && (
          <XpLevelForm
            initialData={editingLevel}
            onSubmit={handleUpdate}
            isLoading={updateLevel.isPending}
            onCancel={() => setEditingLevel(null)}
          />
        )}
      </Modal>
    </div>
  );
}
