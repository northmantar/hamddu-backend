'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { usePointPolicies, useCreatePointPolicy, useUpdatePointPolicy, useDeletePointPolicy } from '@/hooks/queries/use-points';
import {
  usePointActionTypes,
  useCreatePointActionType,
  useUpdatePointActionType,
  useDeletePointActionType,
} from '@/hooks/queries/use-point-action-types';
import { useToast } from '@/components/ui/toast';
import { PointPolicyForm, type PointPolicyFormData } from '@/components/forms/point-policy-form';
import { ActionTypeForm, type ActionTypeFormData } from '@/components/forms/action-type-form';
import type { PointPolicy, PointActionType, CreatePointPolicyDto, UpdatePointPolicyDto } from '@/types';

type Tab = 'policies' | 'action-types';

export default function PointsPage() {
  const [tab, setTab] = useState<Tab>('policies');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">포인트 정책</h1>

      <div className="flex border-b border-gray-200 mb-4">
        {([
          { key: 'policies', label: '지급 정책' },
          { key: 'action-types', label: '액션 타입 관리' },
        ] as Array<{ key: Tab; label: string }>).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'policies' ? <PoliciesTab /> : <ActionTypesTab />}
    </div>
  );
}

function PoliciesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PointPolicy | null>(null);
  const { data: policies, isLoading } = usePointPolicies();
  const { data: actionTypes } = usePointActionTypes();
  const createPolicy = useCreatePointPolicy();
  const updatePolicy = useUpdatePointPolicy();
  const deletePolicy = useDeletePointPolicy();
  const { addToast } = useToast();

  const actionTypeLabel = (code?: string | null) => {
    if (!code) return '-';
    const at = actionTypes?.find((a) => a.code === code);
    return at ? `${at.labelKo} (${code})` : code;
  };

  const handleCreate = async (dto: PointPolicyFormData) => {
    try {
      await createPolicy.mutateAsync(dto as CreatePointPolicyDto);
      addToast('정책이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('정책 추가에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (dto: PointPolicyFormData) => {
    if (!editingPolicy) return;
    try {
      const { actionType: _omit, ...rest } = dto;
      await updatePolicy.mutateAsync({ id: editingPolicy.id, dto: rest as UpdatePointPolicyDto });
      addToast('정책이 수정되었습니다.', 'success');
      setEditingPolicy(null);
    } catch {
      addToast('정책 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 정책을 비활성화하시겠습니까?')) return;
    try {
      await deletePolicy.mutateAsync(id);
      addToast('정책이 비활성화되었습니다.', 'success');
    } catch {
      addToast('정책 삭제에 실패했습니다.', 'error');
    }
  };

  const columns = [
    {
      key: 'actionType',
      header: '액션 타입',
      render: (policy: PointPolicy) => (
        <span className="font-medium">{actionTypeLabel(policy.actionType)}</span>
      ),
    },
    {
      key: 'pointAmount',
      header: '지급 포인트',
      render: (policy: PointPolicy) => {
        const pts = policy.pointAmount ?? policy.points ?? 0;
        return (
          <span className="font-mono text-green-600">+{pts}</span>
        );
      },
    },
    {
      key: 'isOneTime',
      header: '1회성',
      render: (policy: PointPolicy) => (
        <Badge variant={policy.isOneTime ? 'info' : 'default'}>
          {policy.isOneTime ? '1회만' : '반복'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (policy: PointPolicy) => (
        <Badge variant={policy.isActive ? 'success' : 'default'}>
          {policy.isActive ? '활성' : '비활성'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (policy: PointPolicy) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditingPolicy(policy)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(policy.id)}>
            비활성화
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>정책 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={policies || []}
          keyExtractor={(policy) => policy.id}
          isLoading={isLoading}
          emptyMessage="등록된 정책이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="정책 추가">
        <PointPolicyForm
          onSubmit={handleCreate}
          isLoading={createPolicy.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingPolicy} onClose={() => setEditingPolicy(null)} title="정책 수정">
        {editingPolicy && (
          <PointPolicyForm
            initialData={editingPolicy}
            onSubmit={handleUpdate}
            isLoading={updatePolicy.isPending}
            onCancel={() => setEditingPolicy(null)}
          />
        )}
      </Modal>
    </>
  );
}

function ActionTypesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: actionTypes, isLoading } = usePointActionTypes();
  const createActionType = useCreatePointActionType();
  const updateActionType = useUpdatePointActionType();
  const deleteActionType = useDeletePointActionType();
  const { addToast } = useToast();

  const handleCreate = async (dto: ActionTypeFormData) => {
    try {
      await createActionType.mutateAsync(dto);
      addToast('액션 타입이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '액션 타입 추가에 실패했습니다.';
      addToast(msg, 'error');
    }
  };

  const handleToggleActive = async (at: PointActionType) => {
    try {
      await updateActionType.mutateAsync({ code: at.code, dto: { isActive: !at.isActive } });
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`"${code}" 액션 타입을 삭제하시겠습니까?\n사용 중인 정책이 있으면 삭제할 수 없습니다.`)) return;
    try {
      await deleteActionType.mutateAsync(code);
      addToast('액션 타입이 삭제되었습니다.', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '액션 타입 삭제에 실패했습니다.';
      addToast(msg, 'error');
    }
  };

  const columns = [
    { key: 'code', header: '코드', render: (at: PointActionType) => <code className="font-mono">{at.code}</code> },
    { key: 'labelKo', header: '한글 라벨', render: (at: PointActionType) => at.labelKo },
    {
      key: 'event',
      header: '보상 이벤트',
      render: (at: PointActionType) => (
        <span className="font-mono text-xs text-gray-600">{at.refType} / {at.refAction}</span>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (at: PointActionType) => (
        <Select
          value={at.isActive ? 'true' : 'false'}
          onChange={() => handleToggleActive(at)}
          options={[
            { value: 'true', label: '활성' },
            { value: 'false', label: '비활성' },
          ]}
          className="w-24"
        />
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (at: PointActionType) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(at.code)}>
          삭제
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>액션 타입 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={actionTypes || []}
          keyExtractor={(at) => at.code}
          isLoading={isLoading}
          emptyMessage="등록된 액션 타입이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="액션 타입 추가">
        <ActionTypeForm
          onSubmit={handleCreate}
          isLoading={createActionType.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
