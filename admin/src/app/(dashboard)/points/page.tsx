'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { usePointPolicies, useCreatePointPolicy, useUpdatePointPolicy, useDeletePointPolicy } from '@/hooks/queries/use-points';
import { useToast } from '@/components/ui/toast';
import { PointPolicyForm } from '@/components/forms/point-policy-form';
import type { PointPolicy, CreatePointPolicyDto, UpdatePointPolicyDto } from '@/types';

interface PointPolicyFormData {
  eventType?: string;
  name: string;
  description?: string;
  points: number;
  isActive: boolean;
}

export default function PointsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PointPolicy | null>(null);
  const { data: policies, isLoading } = usePointPolicies();
  const createPolicy = useCreatePointPolicy();
  const updatePolicy = useUpdatePointPolicy();
  const deletePolicy = useDeletePointPolicy();
  const { addToast } = useToast();

  const handleCreate = async (dto: PointPolicyFormData) => {
    try {
      await createPolicy.mutateAsync(dto as CreatePointPolicyDto);
      addToast('Policy created successfully', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('Failed to create policy', 'error');
    }
  };

  const handleUpdate = async (dto: PointPolicyFormData) => {
    if (!editingPolicy) return;

    try {
      await updatePolicy.mutateAsync({ id: editingPolicy.id, dto: dto as UpdatePointPolicyDto });
      addToast('Policy updated successfully', 'success');
      setEditingPolicy(null);
    } catch {
      addToast('Failed to update policy', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await deletePolicy.mutateAsync(id);
      addToast('Policy deleted successfully', 'success');
    } catch {
      addToast('Failed to delete policy', 'error');
    }
  };

  const columns = [
    {
      key: 'eventType',
      header: 'Event Type',
      render: (policy: PointPolicy) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{policy.eventType}</code>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (policy: PointPolicy) => (
        <div>
          <div className="font-medium">{policy.name}</div>
          {policy.description && (
            <div className="text-gray-500 text-xs">{policy.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      render: (policy: PointPolicy) => (
        <span className={`font-mono ${policy.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {policy.points >= 0 ? '+' : ''}{policy.points}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (policy: PointPolicy) => (
        <Badge variant={policy.isActive ? 'success' : 'default'}>
          {policy.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: PointPolicy) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingPolicy(policy)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(policy.id)}
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
        <h1 className="text-2xl font-bold text-gray-900">Point Policies</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Policy</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={policies || []}
          keyExtractor={(policy) => policy.id}
          isLoading={isLoading}
          emptyMessage="No policies found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Point Policy"
      >
        <PointPolicyForm
          onSubmit={handleCreate}
          isLoading={createPolicy.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingPolicy}
        onClose={() => setEditingPolicy(null)}
        title="Edit Point Policy"
      >
        {editingPolicy && (
          <PointPolicyForm
            initialData={editingPolicy}
            onSubmit={handleUpdate}
            isLoading={updatePolicy.isPending}
            onCancel={() => setEditingPolicy(null)}
          />
        )}
      </Modal>
    </div>
  );
}
