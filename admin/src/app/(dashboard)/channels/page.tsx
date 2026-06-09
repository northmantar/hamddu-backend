'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '@/hooks/queries/use-channels';
import { useToast } from '@/components/ui/toast';
import { ChannelForm } from '@/components/forms/channel-form';
import type { Channel, ChannelStatus, CreateChannelDto } from '@/types';

const STATUS_LABELS: Record<ChannelStatus, string> = { active: '활성', inactive: '비활성' };
const PLATFORM_LABELS: Record<string, string> = { youtube: 'YouTube' };

export default function ChannelsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: channels, isLoading } = useChannels();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();
  const { addToast } = useToast();

  const handleCreate = async (dto: CreateChannelDto) => {
    try {
      await createChannel.mutateAsync(dto);
      addToast('채널이 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('채널 추가에 실패했습니다.', 'error');
    }
  };

  const handleStatusChange = async (channel: Channel, status: ChannelStatus) => {
    try {
      await updateChannel.mutateAsync({ id: channel.id, dto: { status } });
      addToast('상태가 변경되었습니다.', 'success');
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('채널을 삭제하시겠습니까?')) return;
    try {
      await deleteChannel.mutateAsync(id);
      addToast('채널이 삭제되었습니다.', 'success');
    } catch {
      addToast('채널 삭제에 실패했습니다.', 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      header: '이름',
      render: (channel: Channel) => (
        <div>
          <div className="font-medium">{channel.name}</div>
          <div className="text-gray-500 text-xs">{channel.sourceChannelId}</div>
        </div>
      ),
    },
    {
      key: 'platform',
      header: '플랫폼',
      render: (channel: Channel) => (
        <Badge variant="danger">{PLATFORM_LABELS[channel.platform] ?? channel.platform}</Badge>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (channel: Channel) => (
        <Select
          value={channel.status}
          onChange={(e) => handleStatusChange(channel, e.target.value as ChannelStatus)}
          options={[
            { value: 'active', label: STATUS_LABELS.active },
            { value: 'inactive', label: STATUS_LABELS.inactive },
          ]}
          className="w-28"
        />
      ),
    },
    {
      key: 'addedAt',
      header: '추가일자',
      render: (channel: Channel) => new Date(channel.addedAt).toLocaleDateString('ko-KR'),
    },
    {
      key: 'actions',
      header: '관리',
      render: (channel: Channel) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(channel.id)}>
          삭제
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">채널 관리</h1>
        <Button onClick={() => setIsModalOpen(true)}>채널 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={channels || []}
          keyExtractor={(channel) => channel.id}
          isLoading={isLoading}
          emptyMessage="등록된 채널이 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="채널 추가">
        <ChannelForm
          onSubmit={handleCreate}
          isLoading={createChannel.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
