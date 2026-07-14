'use client';

import { useEffect, useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useDeleteCampaign,
  useLevelUpTemplate,
  useUpdateLevelUpTemplate,
} from '@/hooks/queries/use-notifications';
import {
  NotificationCampaignForm,
  type CampaignFormData,
} from '@/components/forms/notification-campaign-form';
import type { CampaignStatus, CreateCampaignDto, NotificationCampaign, UpdateCampaignDto } from '@/types';

type Tab = 'levelup' | 'campaigns';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('campaigns');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">알림 관리</h1>

      <div className="flex border-b border-gray-200 mb-4">
        {([
          { key: 'campaigns', label: '공지 · 배치' },
          { key: 'levelup', label: '레벨업 알림' },
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

      {tab === 'campaigns' ? <CampaignsTab /> : <LevelUpTab />}
    </div>
  );
}

// ─────────────────────────── 공지 · 배치 ───────────────────────────

const STATUS_META: Record<CampaignStatus, { label: string; variant: 'success' | 'info' | 'default' }> = {
  SCHEDULED: { label: '예약됨', variant: 'success' },
  SENT: { label: '발송완료', variant: 'info' },
  ACTIVE: { label: '반복중', variant: 'success' },
  PAUSED: { label: '정지됨', variant: 'default' },
  CANCELED: { label: '취소됨', variant: 'default' },
};

function CampaignsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationCampaign | null>(null);
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const deleteCampaign = useDeleteCampaign();
  const { addToast } = useToast();

  const handleCreate = async (dto: CampaignFormData) => {
    try {
      await createCampaign.mutateAsync(dto as CreateCampaignDto);
      addToast('알림이 등록되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('알림 등록에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (dto: CampaignFormData) => {
    if (!editing) return;
    try {
      const { type: _t, ...rest } = dto;
      await updateCampaign.mutateAsync({ id: editing.id, dto: rest as UpdateCampaignDto });
      addToast('알림이 수정되었습니다.', 'success');
      setEditing(null);
    } catch {
      addToast('알림 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 알림을 삭제(취소)하시겠습니까?')) return;
    try {
      await deleteCampaign.mutateAsync(id);
      addToast('알림이 삭제되었습니다.', 'success');
    } catch {
      addToast('삭제에 실패했습니다.', 'error');
    }
  };

  const columns = [
    {
      key: 'type',
      header: '유형',
      render: (c: NotificationCampaign) => (
        <Badge variant={c.type === 'ANNOUNCEMENT' ? 'info' : 'default'}>
          {c.type === 'ANNOUNCEMENT' ? '공지' : '배치'}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: '제목',
      render: (c: NotificationCampaign) => <span className="font-medium">{c.title}</span>,
    },
    {
      key: 'schedule',
      header: '발송 조건',
      render: (c: NotificationCampaign) => (
        <span className="font-mono text-xs text-gray-600">
          {c.type === 'ANNOUNCEMENT'
            ? c.scheduledAt
              ? new Date(c.scheduledAt).toLocaleString('ko-KR')
              : '-'
            : c.cron ?? '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (c: NotificationCampaign) => (
        <Badge variant={STATUS_META[c.status].variant}>{STATUS_META[c.status].label}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (c: NotificationCampaign) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(c)}>수정</Button>
          {c.type === 'BATCH' && c.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => pauseCampaign.mutate(c.id)}>정지</Button>
          )}
          {c.type === 'BATCH' && c.status === 'PAUSED' && (
            <Button variant="primary" size="sm" onClick={() => resumeCampaign.mutate(c.id)}>재개</Button>
          )}
          <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>삭제</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>알림 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={campaigns || []}
          keyExtractor={(c) => c.id}
          isLoading={isLoading}
          emptyMessage="등록된 알림이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="알림 추가">
        <NotificationCampaignForm
          onSubmit={handleCreate}
          isLoading={createCampaign.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="알림 수정">
        {editing && (
          <NotificationCampaignForm
            initialData={editing}
            onSubmit={handleUpdate}
            isLoading={updateCampaign.isPending}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────── 레벨업 알림 ───────────────────────────

function LevelUpTab() {
  const { data: template, isLoading } = useLevelUpTemplate();
  const updateTemplate = useUpdateLevelUpTemplate();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setBody(template.body);
      setIsActive(template.isActive);
    }
  }, [template]);

  const handleSave = async () => {
    try {
      await updateTemplate.mutateAsync({ title, body, isActive });
      addToast('레벨업 알림이 저장되었습니다.', 'success');
    } catch {
      addToast('저장에 실패했습니다.', 'error');
    }
  };

  if (isLoading) return <p className="text-gray-500">불러오는 중…</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-xl space-y-4">
      <p className="text-sm text-gray-500">
        XP가 레벨 임계값에 도달하면 발송됩니다. 문구에{' '}
        <code className="font-mono text-primary-600">{'{level}'}</code>(레벨 번호),{' '}
        <code className="font-mono text-primary-600">{'{label}'}</code>(칭호)를 쓸 수 있습니다.
      </p>

      <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <Select
        label="발송 여부"
        value={isActive ? 'true' : 'false'}
        onChange={(e) => setIsActive(e.target.value === 'true')}
        options={[
          { value: 'true', label: '발송함' },
          { value: 'false', label: '발송 안 함' },
        ]}
      />

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} isLoading={updateTemplate.isPending}>저장</Button>
      </div>
    </div>
  );
}
