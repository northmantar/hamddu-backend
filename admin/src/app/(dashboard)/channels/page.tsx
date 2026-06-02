'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useChannels, useCreateChannel, useDeleteChannel } from '@/hooks/queries/use-channels';
import { useToast } from '@/components/ui/toast';
import { ChannelForm } from '@/components/forms/channel-form';
import type { Channel, CreateChannelDto } from '@/types';

export default function ChannelsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: channels, isLoading } = useChannels();
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();
  const { addToast } = useToast();

  const handleCreate = async (dto: CreateChannelDto) => {
    try {
      await createChannel.mutateAsync(dto);
      addToast('Channel created successfully', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('Failed to create channel', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      await deleteChannel.mutateAsync(id);
      addToast('Channel deleted successfully', 'success');
    } catch {
      addToast('Failed to delete channel', 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Channel',
      render: (channel: Channel) => (
        <div className="flex items-center gap-3">
          {channel.profileImageUrl && (
            <img
              src={channel.profileImageUrl}
              alt={channel.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{channel.name}</div>
            <div className="text-gray-500 text-xs">{channel.channelId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'platformType',
      header: 'Platform',
      render: (channel: Channel) => (
        <Badge variant={channel.platformType === 'youtube' ? 'danger' : 'success'}>
          {channel.platformType}
        </Badge>
      ),
    },
    {
      key: 'subscriberCount',
      header: 'Subscribers',
      render: (channel: Channel) => channel.subscriberCount.toLocaleString(),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (channel: Channel) => new Date(channel.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (channel: Channel) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDelete(channel.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Channel</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={channels || []}
          keyExtractor={(channel) => channel.id}
          isLoading={isLoading}
          emptyMessage="No channels found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Channel"
      >
        <ChannelForm
          onSubmit={handleCreate}
          isLoading={createChannel.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
