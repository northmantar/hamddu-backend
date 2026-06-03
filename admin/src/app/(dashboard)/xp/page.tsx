'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useXpLevels, useCreateXpLevel, useUpdateXpLevel, useDeleteXpLevel } from '@/hooks/queries/use-xp';
import { useToast } from '@/components/ui/toast';
import { XpLevelForm } from '@/components/forms/xp-level-form';
import type { XpLevel, CreateXpLevelDto, UpdateXpLevelDto } from '@/types';

interface XpLevelFormData {
  level?: number;
  name: string;
  minXp: number;
  maxXp?: number;
}

export default function XpPage() {
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
      addToast('Level created successfully', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('Failed to create level', 'error');
    }
  };

  const handleUpdate = async (dto: XpLevelFormData) => {
    if (!editingLevel) return;

    try {
      await updateLevel.mutateAsync({ id: editingLevel.id, dto: dto as UpdateXpLevelDto });
      addToast('Level updated successfully', 'success');
      setEditingLevel(null);
    } catch {
      addToast('Failed to update level', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
      await deleteLevel.mutateAsync(id);
      addToast('Level deleted successfully', 'success');
    } catch {
      addToast('Failed to delete level', 'error');
    }
  };

  const sortedLevels = [...(levels || [])].sort((a, b) => a.level - b.level);

  const columns = [
    {
      key: 'level',
      header: 'Level',
      render: (level: XpLevel) => (
        <span className="font-bold text-lg">{level.level}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (level: XpLevel) => (
        <span className="font-medium">{level.label ?? level.name ?? '-'}</span>
      ),
    },
    {
      key: 'minXp',
      header: 'Min XP',
      render: (level: XpLevel) => (
        <span className="font-mono">{(level.xpThreshold ?? level.minXp ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'maxXp',
      header: 'Max XP',
      render: (level: XpLevel) => (
        <span className="font-mono">
          {level.maxXp ? level.maxXp.toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (level: XpLevel) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingLevel(level)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(level.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">XP Levels</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Level</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={sortedLevels}
          keyExtractor={(level) => level.id}
          isLoading={isLoading}
          emptyMessage="No levels found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add XP Level"
      >
        <XpLevelForm
          onSubmit={handleCreate}
          isLoading={createLevel.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingLevel}
        onClose={() => setEditingLevel(null)}
        title="Edit XP Level"
      >
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
