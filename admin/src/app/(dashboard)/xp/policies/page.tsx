'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import {
  useXpEarningPolicies,
  useCreateXpEarningPolicy,
  useUpdateXpEarningPolicy,
  useDeleteXpEarningPolicy,
  useXpActionTypes,
  useCreateXpActionType,
  useUpdateXpActionType,
  useDeleteXpActionType,
} from '@/hooks/queries/use-xp-policies';
import { useToast } from '@/components/ui/toast';
import { XpPolicyForm, type XpPolicyFormData } from '@/components/forms/xp-policy-form';
import { ActionTypeForm, type ActionTypeFormData } from '@/components/forms/action-type-form';
import type { XpEarningPolicy, XpActionType, CreateXpPolicyDto, UpdateXpPolicyDto } from '@/types';

type Tab = 'policies' | 'action-types';

export default function XpPoliciesPage() {
  const [tab, setTab] = useState<Tab>('policies');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">XP 지급 정책</h1>

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
  const [editing, setEditing] = useState<XpEarningPolicy | null>(null);
  const { data: policies, isLoading } = useXpEarningPolicies();
  const { data: actionTypes } = useXpActionTypes();
  const createPolicy = useCreateXpEarningPolicy();
  const updatePolicy = useUpdateXpEarningPolicy();
  const deletePolicy = useDeleteXpEarningPolicy();
  const { addToast } = useToast();

  const actionTypeLabel = (code?: string | null) => {
    if (!code) return '-';
    const at = actionTypes?.find((a) => a.code === code);
    return at ? `${at.labelKo} (${code})` : code;
  };

  const handleCreate = async (dto: XpPolicyFormData) => {
    try {
      await createPolicy.mutateAsync(dto as CreateXpPolicyDto);
      addToast('정책이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('정책 추가에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (dto: XpPolicyFormData) => {
    if (!editing) return;
    try {
      const { actionType: _omit, ...rest } = dto;
      await updatePolicy.mutateAsync({ id: editing.id, dto: rest as UpdateXpPolicyDto });
      addToast('정책이 수정되었습니다.', 'success');
      setEditing(null);
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
      render: (p: XpEarningPolicy) => <span className="font-medium">{actionTypeLabel(p.actionType)}</span>,
    },
    {
      key: 'xpAmount',
      header: '지급 XP',
      render: (p: XpEarningPolicy) => <span className="font-mono text-green-600">+{p.xpAmount}</span>,
    },
    {
      key: 'isOneTime',
      header: '1회성',
      render: (p: XpEarningPolicy) => (
        <Badge variant={p.isOneTime ? 'info' : 'default'}>{p.isOneTime ? '1회만' : '반복'}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (p: XpEarningPolicy) => (
        <Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? '활성' : '비활성'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (p: XpEarningPolicy) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>수정</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>비활성화</Button>
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
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyMessage="등록된 정책이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="정책 추가">
        <XpPolicyForm
          onSubmit={handleCreate}
          isLoading={createPolicy.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="정책 수정">
        {editing && (
          <XpPolicyForm
            initialData={editing}
            onSubmit={handleUpdate}
            isLoading={updatePolicy.isPending}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function ActionTypesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: actionTypes, isLoading } = useXpActionTypes();
  const createAt = useCreateXpActionType();
  const updateAt = useUpdateXpActionType();
  const deleteAt = useDeleteXpActionType();
  const { addToast } = useToast();

  const handleCreate = async (dto: ActionTypeFormData) => {
    try {
      await createAt.mutateAsync(dto);
      addToast('액션 타입이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '액션 타입 추가에 실패했습니다.';
      addToast(msg, 'error');
    }
  };

  const handleToggle = async (at: XpActionType) => {
    try {
      await updateAt.mutateAsync({ code: at.code, dto: { isActive: !at.isActive } });
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`"${code}" 액션 타입을 삭제하시겠습니까?`)) return;
    try {
      await deleteAt.mutateAsync(code);
      addToast('삭제되었습니다.', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '액션 타입 삭제에 실패했습니다.';
      addToast(msg, 'error');
    }
  };

  const columns = [
    { key: 'code', header: '코드', render: (at: XpActionType) => <code className="font-mono">{at.code}</code> },
    { key: 'labelKo', header: '한글 라벨', render: (at: XpActionType) => at.labelKo },
    {
      key: 'event',
      header: '보상 이벤트',
      render: (at: XpActionType) => (
        <span className="font-mono text-xs text-gray-600">{at.refType} / {at.refAction}</span>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (at: XpActionType) => (
        <Select
          value={at.isActive ? 'true' : 'false'}
          onChange={() => handleToggle(at)}
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
      render: (at: XpActionType) => (
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
          isLoading={createAt.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
